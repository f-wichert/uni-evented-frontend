import { WritableDraft } from 'immer/dist/types/types-external';
import { useCallback, useEffect } from 'react';
import shallow from 'zustand/shallow';

import { Event, Media, MediaManager, MediaResponse } from '../models';
import {
    EventExtra,
    EventManager,
    EventResponse,
    EventStatus,
    RelevantEventsResponse,
} from '../models/event';
import { notEmpty, request, useAsync } from '../util';
import { createStore } from './utils/createStore';

interface State {
    events: Readonly<{ [id: string]: Event }>;
    eventMedia: Readonly<{ [eventId: string]: Media[] }>;
    // `undefined` means the value hasn't loaded yet, it's expected to be set by `fetchCurrentUser`
    currentEventId: string | null | undefined;
}

export const useEventStore = createStore<State>('event')(() => ({
    events: {},
    eventMedia: {},
    currentEventId: undefined,
}));

/** Helper for adding events to state, merging new data with existing data. */
export function addEvents(state: WritableDraft<State>, events: EventExtra | EventExtra[]) {
    if (!Array.isArray(events)) events = [events];

    for (const event of events) {
        if (event.media) {
            state.eventMedia[event.id] = event.media;
            delete event.media;
        }

        state.events[event.id] = {
            // (shallow) merge old and new event data
            // TODO: this probably causes unnecessary renders if the
            //       data didn't actually change, maybe use tracked state thingy?
            ...state.events[event.id],
            ...event,
        };
    }
}

export function useEvent(id: string): Event | undefined {
    return useEventStore((state) => state.events[id]);
}

export function useEventFetch(id: string) {
    if (!id) throw new Error(`Invalid event ID: ${id}`);
    const fetchFunc = useCallback(async () => {
        const eventData = await request<EventResponse>('GET', `event/info/${id}`);

        useEventStore.setState((state) =>
            addEvents(state, EventManager.fromEventResponse(eventData))
        );
    }, [id]);

    const { refresh, loading, value: _ignored, ...rest } = useAsync(fetchFunc, false);

    const event = useEvent(id);
    useEffect(() => {
        // if event isn't stored already, start fetching it
        if (!event) {
            refresh();
        }
    }, [event, refresh]);

    return { refresh, loading, event, ...rest };
}

export function useMedia(eventId: string): Media[] | undefined {
    return useEventStore((state) => state.eventMedia[eventId]);
}

export function useMediaFetch(eventId: string) {
    if (!eventId) throw new Error(`Invalid event ID: ${eventId}`);

    const fetchFunc = useCallback(async () => {
        const mediaData = await request<MediaResponse[]>('GET', `event/info/${eventId}/media`);

        useEventStore.setState((state) => {
            state.eventMedia[eventId] = mediaData.map((m) => MediaManager.fromMediaResponse(m));
        });
    }, [eventId]);

    const { refresh, loading, value: _ignored, ...rest } = useAsync(fetchFunc, false);

    const media = useMedia(eventId);
    useEffect(() => {
        // if media isn't stored already, start fetching it
        if (!media) {
            refresh();
        }
    }, [media, refresh]);

    return { refresh, loading, media, ...rest };
}

export function useRelevantEvents(userId?: string) {
    const fetchFunc = useCallback(async () => {
        const body = userId ? { userId } : null;
        const data = await request<RelevantEventsResponse>('GET', 'event/relevantEvents', body);

        // add event objects to store
        useEventStore.setState((state) => {
            addEvents(
                state,
                [
                    ...data.hostedEvents,
                    ...(data.currentEvent ? [data.currentEvent] : []),
                    ...data.interestedEvents,
                    ...data.pastEvents,
                ].map((e) => EventManager.fromEventResponse(e))
            );
        });

        const hostedIDs = data.hostedEvents.map((e) => e.id);

        // return just the IDs
        return {
            hostedEvents: data.hostedEvents.map((e) => e.id),
            currentEvent: data.currentEvent?.id,
            // exclude hosted events from user's interested events, since those always include hosted events
            interestedEvents: data.interestedEvents
                .filter((e) => !hostedIDs.includes(e.id))
                .map((e) => e.id),
            pastEvents: data.pastEvents.map((e) => e.id),
        };
    }, [userId]);

    return useAsync(fetchFunc);
}

// NOTE: make sure `options` doesn't change every render (i.e. memoize it or use `useState` instead),
//       otherwise this will re-render indefinitely
export function useFindEvents(options?: {
    statuses?: EventStatus[];
    loadUsers?: boolean;
    loadMedia?: boolean;
    lat?: number;
    lon?: number;
    maxResults?: number;
    maxRadius?: number;
}) {
    const fetchFunc = useCallback(async () => {
        const eventsData = await request<EventResponse[]>('GET', 'event/find', options);

        // add event objects to store
        useEventStore.setState((state) => {
            addEvents(
                state,
                eventsData.map((e) => EventManager.fromEventResponse(e))
            );
        });

        // return just the IDs
        return eventsData.map((e) => e.id);
    }, [options]);

    const { value: eventIDs, ...rest } = useAsync(fetchFunc);

    const events = useEventStore(
        (state) => eventIDs?.map((id) => state.events[id]).filter(notEmpty) ?? [],
        shallow
    );

    return { events, ...rest };
}
