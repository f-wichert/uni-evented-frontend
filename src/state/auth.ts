import * as SecureStore from 'expo-secure-store';
import { persist, StateStorage } from 'zustand/middleware';

import { AuthResponse } from '../models/user';
import { EmptyObject } from '../types';
import { handleError, request } from '../util';
import { useUserStore } from './user';
import { createStore, resetAllStores } from './utils/createStore';

interface State {
    token: string | null;

    signin: (params: { username: string; password: string }) => Promise<void>;
    signup: (params: { username: string; email: string; password: string }) => Promise<void>;
    signout: () => void;

    reset: (params: { email: string }) => Promise<void>;

    // Once persisted data was rehydrated, we set this to true:
    // https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md#hydration-and-asynchronous-storages
    _hasHydrated: boolean;
}

// TODO: SecureStore doesn't work on web, may be the only blocker
const secureStoreWrapper: StateStorage = {
    getItem: SecureStore.getItemAsync.bind(SecureStore),
    setItem: SecureStore.setItemAsync.bind(SecureStore),
    removeItem: SecureStore.deleteItemAsync.bind(SecureStore),
};

export const useAuthStore = createStore<State>('auth', { skipReset: true })(
    persist(
        (set) => ({
            token: null,

            signin: async (params) => {
                const data = await request<AuthResponse>('POST', '/auth/login', params, {
                    noAuth: true,
                });

                // TODO: validate types
                set((state) => {
                    state.token = data.token;
                });
            },
            signup: async (params) => {
                const data = await request<AuthResponse>('POST', '/auth/register', params, {
                    noAuth: true,
                });

                // TODO: validate types
                set((state) => {
                    state.token = data.token;
                });
            },
            signout: () => {
                set((state) => {
                    state.token = null;
                });
            },
            reset: async (params) => {
                await request<EmptyObject>('POST', '/auth/reset', params, { noAuth: true });

                set((state) => {
                    state.token = null;
                });
            },

            _hasHydrated: false,
        }),
        {
            name: 'auth',
            getStorage: () => secureStoreWrapper,
            partialize: (state) => ({ token: state.token }),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    handleError(error, { prefix: 'Failed to rehydrate persistent storage' });
                }
                // set `_hasHydrated` regardless of whether rehydration was successful
                useAuthStore.setState((state) => {
                    state._hasHydrated = true;
                });
            },
        }
    )
);

// TODO: use computed property? https://github.com/pmndrs/zustand/discussions/1363#discussioncomment-3874571
useAuthStore.subscribe(
    (state) => state.token,
    (token) => {
        // clear stores (except auth store, see `skipReset` above) if token changed
        resetAllStores();

        // start fetching user data if there's a new token
        if (token) {
            useUserStore
                .getState()
                .fetchCurrentUser()
                .catch((e) => {
                    handleError(e, { prefix: 'Failed to retrieve user data' });
                    // reset token if we failed to fetch the user data
                    // TODO: show a 'try again' button instead
                    useAuthStore.setState((state) => {
                        state.token = null;
                    });
                });
        }
    }
);

// NOTE: This isn't a hook, it accesses the state directly and is not reactive.
// For auth tokens, this is fine, but generally hooks should be used
export function getToken() {
    return useAuthStore.getState().token;
}
