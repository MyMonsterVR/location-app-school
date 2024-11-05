import '@/global.css';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';
import {SplashScreen, Tabs} from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from "react";
import {getItem, setItem} from "@/app/utils/AsyncStorage";
import {Theme, ThemeProvider} from "@react-navigation/native";

const LIGHT_THEME: Theme = {
    dark: false,
    colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
    dark: true,
    colors: NAV_THEME.dark,
};

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default () => {
    const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
    const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

    React.useEffect(() => {
        (async () => {
            const theme = await getItem('theme');
            if (!theme) {
                await setItem('theme', colorScheme);
                setIsColorSchemeLoaded(true);
                return;
            }
            const colorTheme = theme === 'dark' ? 'dark' : 'light';
            if (colorTheme !== colorScheme) {
                setColorScheme(colorTheme);

                setIsColorSchemeLoaded(true);
                return;
            }
            setIsColorSchemeLoaded(true);
        })().finally(() => {
            SplashScreen.hideAsync();
        });
    }, []);

    if (!isColorSchemeLoaded) {
        return null;
    }

    return (
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
            <Tabs screenOptions={{
                headerShown: false,
                tabBarInactiveBackgroundColor: isDarkColorScheme ? 'hsl(240,4%,14%)' : 'hsl(0,3%,94%)',
                tabBarActiveBackgroundColor: isDarkColorScheme ? 'hsl(240,5%,22%)' : 'hsl(0,0%,100%)',
            }}>
                <Tabs.Screen name="friends" options={{
                    title: 'Friends',
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="users" color="gray" />,
                }}/>
                <Tabs.Screen name="map" options={{
                    title: 'Map',
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="map" color="gray" />,
                }}/>
                <Tabs.Screen name="settings" options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="cog" color="gray" />,
                }}/>
            </Tabs>
        </ThemeProvider>
    );
};