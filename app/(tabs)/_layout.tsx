import '@/global.css';
import {Tabs} from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {useTheme} from "@react-navigation/native";
import {useAuth} from "@clerk/clerk-expo";
import {useEffect, useState} from "react";
import * as Location from "expo-location";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

export default () =>
{
    const theme = useTheme();

    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarInactiveBackgroundColor: theme.colors.tabBarInactiveBackgroundColor,
            tabBarActiveBackgroundColor: theme.colors.tabBarActiveBackgroundColor,
        }}>
            <Tabs.Screen name="friends" options={{
                title: 'Friends',
                tabBarIcon: ({color}) => <FontAwesome size={28} name="users" color="gray"/>,
            }}/>
            <Tabs.Screen name="map" options={{
                title: 'Map',
                tabBarIcon: ({color}) => <FontAwesome size={28} name="map" color="gray"/>,
            }}/>
            <Tabs.Screen name="settings" options={{
                title: 'Settings',
                tabBarIcon: ({color}) => <FontAwesome size={28} name="cog" color="gray"/>,
            }}/>
        </Tabs>
    );
};