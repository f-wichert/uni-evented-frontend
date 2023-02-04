import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import { ListRenderItem, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'react-native-collapsible-tab-view';

import yellowSplash from '../../assets/yellow_splash.png';
import EventPreview from '../components/EventPreview';
import ProfileHeader from '../components/ProfileHeader';
import ValueDisplay from '../components/ValueDisplay';
import { User, UserManager } from '../models';
import { UserDetails } from '../models/user';
import { CommonStackProps, ProfileStackNavProps } from '../nav/types';
import { useRelevantEvents } from '../state/event';
import { useUserFetch } from '../state/user';
import { identity } from '../util';

interface MainViewProps {
    user: User;
    details: UserDetails | undefined;
    navigation: CommonStackProps<'UserProfile'>['navigation'];
}

function MainView({ user, details, navigation }: MainViewProps) {
    const showFollowing = useCallback(
        () => navigation.navigate('FollowList', { userId: user.id, type: 'following' }),
        [user.id, navigation]
    );
    const showFollowers = useCallback(
        () => navigation.navigate('FollowList', { userId: user.id, type: 'followers' }),
        [user.id, navigation]
    );

    return (
        <View style={styles.container}>
            <View style={styles.profileHeader}>
                <ProfileHeader
                    imageUri={UserManager.getAvatarUrl(user)}
                    displayName={user.displayName}
                    username={user.username}
                    // TODO: better fallback image
                    fallbackImage={yellowSplash}
                    compact
                />
            </View>

            {user.bio ? (
                <View style={styles.bio}>
                    <Text>{user.bio}</Text>
                </View>
            ) : null}

            <View style={styles.values}>
                <ValueDisplay
                    value={details?.numFollowing}
                    name="Following"
                    onPress={showFollowing}
                />
                <ValueDisplay
                    value={details?.numFollowers}
                    name="Followers"
                    onPress={showFollowers}
                />
                <ValueDisplay value={details?.numEvents} name="Events" />
            </View>
        </View>
    );
}

export default function UserProfileScreen({ navigation, route }: CommonStackProps<'UserProfile'>) {
    const showEdit = route.params.showEdit ?? false;
    const userId = route.params.userId;

    const { user, details, loading, refresh: refreshUser } = useUserFetch(userId, true);
    const { value: events, refresh: refreshEvents } = useRelevantEvents(userId);

    const refresh = useCallback(() => {
        refreshUser();
        refreshEvents();
    }, [refreshUser, refreshEvents]);

    useFocusEffect(useCallback(() => void refresh(), [refresh]));

    // show edit header button if needed
    useEffect(() => {
        navigation.setOptions({
            headerRight: () =>
                showEdit ? (
                    <Ionicons
                        name="create-outline"
                        size={32}
                        color="black"
                        onPress={() =>
                            (navigation as ProfileStackNavProps['navigation']).navigate(
                                'EditProfile'
                            )
                        }
                    />
                ) : null,
        });
    }, [navigation, showEdit]);

    // show username in title
    const username = user?.username;
    useEffect(() => {
        navigation.setOptions({
            title: username ? `${username}'s Profile` : 'User Profile',
        });
    }, [navigation, username]);

    const navigateDetail = useCallback(
        (id: string) => navigation.navigate('EventDetail', { eventId: id }),
        [navigation]
    );

    const renderMain = useCallback(
        () =>
            user ? (
                <MainView user={user} details={details ?? undefined} navigation={navigation} />
            ) : (
                <View style={styles.mainEmpty} />
            ),
        [user, details, navigation]
    );
    const renderEventItem: ListRenderItem<string> = useCallback(
        ({ item }) => <EventPreview id={item} navigateDetail={navigateDetail} />,
        [navigateDetail]
    );

    return (
        <ScrollView
            nestedScrollEnabled
            contentContainerStyle={{
                height: '100%',
            }}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        >
            <Tabs.Container renderHeader={renderMain}>
                <Tabs.Tab name="Hosted Events">
                    <Tabs.FlatList
                        data={events?.hostedEvents}
                        renderItem={renderEventItem}
                        keyExtractor={identity}
                        nestedScrollEnabled
                    />
                </Tabs.Tab>
                {/* TODO: rename this tab? can't think of a better name */}
                <Tabs.Tab name="Interested">
                    <Tabs.FlatList
                        data={events?.interestedEvents}
                        renderItem={renderEventItem}
                        keyExtractor={identity}
                        nestedScrollEnabled
                    />
                </Tabs.Tab>
                <Tabs.Tab name="Visited Events">
                    <Tabs.FlatList
                        data={events?.pastEvents}
                        renderItem={renderEventItem}
                        keyExtractor={identity}
                        nestedScrollEnabled
                    />
                </Tabs.Tab>
            </Tabs.Container>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: 8,
        marginBottom: 16,
        backgroundColor: 'white',
    },

    mainEmpty: {
        height: 200,
    },

    profileHeader: {
        marginHorizontal: '5%',
    },

    bio: {
        marginHorizontal: '5%',
        marginTop: 10,
    },

    values: {
        marginTop: 20,
        marginHorizontal: '15%',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});
