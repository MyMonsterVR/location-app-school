import React from 'react';
import { Stack } from 'expo-router';
import {Theme, ThemeProvider} from "@react-navigation/native";
import { NAV_THEME } from '@/lib/constants';
import { useColorScheme } from '@/lib/useColorScheme';
import { SplashScreen } from 'expo-router';
import { getItem, setItem } from "@/app/utils/AsyncStorage";

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

const PublicLayout = () => {
    const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
    const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

    if (!isColorSchemeLoaded) {
        return null;
    }

    return (
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
            <Stack screenOptions={{
                headerShown: false,
            }}>
            <Stack.Screen
                name="login"
                options={{headerTitle: 'Login'}}
            />
            <Stack.Screen
                name="register"
                options={{headerTitle: 'Register'}}
            />
            <Stack.Screen
                name="reset"
                options={{headerTitle: 'Forgot Password'}}
            />
            </Stack>
        </ThemeProvider>
    );
}