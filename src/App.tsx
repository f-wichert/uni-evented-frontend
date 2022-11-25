import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { ReactNode, useContext } from 'react';
import { default as Toast, ToastProvider } from 'react-native-toast-notifications';

import { Context as AuthContext, Provider as AuthProvider } from './contexts/authContext';
import CreateEventScreen from './screens/CreateEventScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import LoginScreen from './screens/LoginScreen';
import MapScreen from './screens/MapScreen';
import RegisterScreen from './screens/RegisterScreen';
import ViewEventScreen from './screens/ViewEventScreen';
import { IoniconsName } from './types';

// https://reactnavigation.org/docs/typescript/
// instead of `undefined`, props passed to these screens would be defined here if applicable

export type RootNavigatorParams = {
    LoginScreen: undefined;
    RegisterScreen: undefined;
    TabScreen: undefined;
};

const Stack = createNativeStackNavigator<RootNavigatorParams>();

export type TabNavigatorParams = {
    Discover: undefined;
    Create: undefined;
    Map: undefined;
    Event: undefined;
};

const Tab = createBottomTabNavigator<TabNavigatorParams>();

function TabScreen() {
    const { state } = useContext(AuthContext);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: IoniconsName;

                    if (route.name === 'Discover') {
                        iconName = focused ? 'play' : 'play-outline';
                        // } else if (route.name === 'Settings') {
                        //   iconName = focused ? 'settings' : 'settings-outline';
                    } else if (route.name === 'Map') {
                        iconName = focused ? 'map' : 'map-outline';
                        // } else if (route.name === 'Profile') {
                        //   iconName = focused ? 'person' : 'person-outline';
                    } else if (route.name === 'Create') {
                        iconName = focused ? 'add' : 'add-outline';
                    } else if (route.name === 'Event') {
                        iconName = focused ? 'rocket' : 'rocket-outline';
                    } else {
                        throw new Error(`Unknown route '${route.name}'`);
                    }

                    // You can return any component that you like here!
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: 'tomato',
                tabBarInactiveTintColor: 'gray',
            })}
            initialRouteName={state.eventActive ? 'Event' : 'Discover'}
        >
            <Tab.Screen name="Discover" component={DiscoverScreen} />
            {state.eventActive ? (
                <Tab.Screen name="Event" component={ViewEventScreen} />
            ) : (
                <Tab.Screen name="Create" component={CreateEventScreen} />
            )}
            <Tab.Screen name="Map" component={MapScreen} />
        </Tab.Navigator>
    );
}

// wrapper for providers and similar root components,
// to avoid constantly having to indent the app hierarchy below further
function RootWrapper({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
    );
}

function ToastRoot() {
    return (
        <Toast
            // make `toast.show` globally available
            ref={(ref) => ref && (globalThis['toast'] = ref)}
            placement="top"
            offset={20}
            successIcon={<Ionicons name="checkmark" color="#fff" size={18} />}
            // successColor=''
            warningIcon={<Ionicons name="warning" color="#fff" size={18} />}
            warningColor="gold"
            dangerIcon={<Ionicons name="close" color="#fff" size={18} />}
            // dangerColor=''
        />
    );
}

export default function App() {
    return (
        <RootWrapper>
            <NavigationContainer>
                <Stack.Navigator>
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
                        name="TabScreen"
                        component={TabScreen}
                        options={{ headerShown: false }}
                    />
                    {/* <Stack.Screen name="EventScreen" component={ViewEventScreen} /> */}
                </Stack.Navigator>
            </NavigationContainer>
            <ToastRoot />
        </RootWrapper>
    );
}
