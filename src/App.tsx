import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ToastRoot from './components/ToastRoot';
import TabNavigator from './nav/TabNavigator';
import { AnyRootNavParams } from './nav/types';
import { useNotifications } from './notifications';
import LoadingScreen from './screens/LoadingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import { useAuthStore } from './state/auth';
import { useEventStore } from './state/event';
import { useUserStore } from './state/user';

const Stack = createNativeStackNavigator<AnyRootNavParams>();

function useRootNavigationState(): 'login' | 'loading' | 'main' {
    const hydrated = useAuthStore((state) => state._hasHydrated);
    const token = useAuthStore((state) => state.token);

    const userId = useUserStore((state) => state.currentUserId);
    const currentEventId = useEventStore((state) => state.currentEventId);

    // persistent storage hasn't loaded yet, we don't know yet whether to show login or main view
    if (!hydrated) return 'loading';

    // no token, show login/register stack
    if (!token) return 'login';
    // user (or other data we need for initial layout) hasn't loaded yet, show loading screen
    if (!userId || currentEventId === undefined) return 'loading';
    // otherwise, show main application
    return 'main';
}

function App() {
    useNotifications();

    const navState = useRootNavigationState();

    // https://reactnavigation.org/docs/auth-flow
    let screens;
    if (navState === 'login') {
        // TODO: fix signout animation using `animationTypeForReplace`
        screens = (
            <>
                <Stack.Screen
                    name="LoginScreen"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="RegisterScreen"
                    component={RegisterScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ResetPasswordScreen"
                    component={ResetPasswordScreen}
                    options={{ headerShown: false }}
                />
            </>
        );
    } else if (navState === 'loading') {
        screens = (
            <>
                <Stack.Screen
                    name="LoadingScreen"
                    component={LoadingScreen}
                    options={{ headerShown: false, animation: 'fade' }}
                />
            </>
        );
    } else if (navState === 'main') {
        screens = (
            <>
                <Stack.Screen
                    name="TabScreen"
                    component={TabNavigator}
                    options={{ headerShown: false, animation: 'fade' }}
                />
            </>
        );
    } else {
        throw new Error(`Unknown root navigation state: ${navState}`);
    }

    return <Stack.Navigator>{screens}</Stack.Navigator>;
}

export default function Root() {
    return (
        <ActionSheetProvider>
            <SafeAreaProvider>
                <ToastRoot />

                <NavigationContainer>
                    <App />
                </NavigationContainer>

                <StatusBar style="dark" />
            </SafeAreaProvider>
        </ActionSheetProvider>
    );
}
