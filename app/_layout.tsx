import {SplashScreen, Stack, useRouter, useSegments} from "expo-router";
import '@/global.css';
import {ClerkProvider, ClerkLoaded, useAuth} from '@clerk/clerk-expo'
import { Slot } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import {useEffect, useState} from 'react'
import {useColorScheme} from "@/lib/useColorScheme";
import {getItem, setItem} from "@/utils/AsyncStorage";
import {Theme, ThemeProvider} from "@react-navigation/native";
import {NAV_THEME} from "@/lib/constants";
import {PortalHost} from "@rn-primitives/portal";
import {MapProvider} from "@/context/MapContext";
import AsyncStorage from "@react-native-async-storage/async-storage";



const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!
const tokenCache = {
    async getToken(key: string) {
        try {
            const item = await SecureStore.getItemAsync(key)
            if (item) {
                console.log(`${key} was used 🔐 \n`)
            } else {
                console.log('No values stored under key: ' + key)
            }
            return item
        } catch (error) {
            console.error('SecureStore get item error: ', error)
            await SecureStore.deleteItemAsync(key)
            return null
        }
    },
    async saveToken(key: string, value: string) {
        try {
            return SecureStore.setItemAsync(key, value)
        } catch (err) {
            return
        }
    },
}



if (!publishableKey) {
    throw new Error(
        'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
    )
}

export interface TokenCache {
    getToken: (key: string) => Promise<string | undefined | null>
    saveToken: (key: string, token: string) => Promise<void>
    clearToken?: (key: string) => void
}

function InitialLayout() {
    const [origin, setOrigin] = useState<OriginLocation | null>(null);
    const { isLoaded, isSignedIn } = useAuth();
    const segment = useSegments();
    const router = useRouter();

    useEffect(() => {
        console.log('isSignedIn: ', isSignedIn)
        if (!isLoaded) return;

        const inTabsGroup = segment[0] === '(tabs)';

        if (isSignedIn && !inTabsGroup) {
            router.replace('/map');
        } else if (!isSignedIn) {
            router.replace('/login');
        }
    }, [isSignedIn])

    return <Slot />;
}

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

export default function RootLayout() {
    const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
    const [isColorSchemeLoaded, setIsColorSchemeLoaded] = useState(false);


    useEffect(() => {
        const loadTheme = async () => {
            const theme = await getItem('theme');
            if (theme) {
                setColorScheme(theme);
            }
            setIsColorSchemeLoaded(true);
            SplashScreen.hideAsync();
        };

        loadTheme();

        const MAX_CACHE_SIZE = 100; // Maximum number of messages to cache
        const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        const clearOldCache = async () =>
        {
            try
            {
                // Get all the keys in AsyncStorage
                const keys = await AsyncStorage.getAllKeys();

                // Filter keys that are related to chat messages
                const messageKeys = keys.filter(key => key.startsWith('messages-'));

                // Define a threshold for cache expiration (e.g., 24 hours)
                const cacheExpirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
                const currentTime = new Date().getTime();

                // Iterate over each message cache key and check its timestamp
                for (const key of messageKeys)
                {
                    const cachedData = await AsyncStorage.getItem(key);
                    const data = JSON.parse(cachedData);

                    if (data && data.timestamp)
                    {
                        const cacheAge = currentTime - new Date(data.timestamp).getTime();

                        // If cache is older than the expiration time, clear it
                        if (cacheAge > cacheExpirationTime)
                        {
                            console.log(`Cache for ${key} is older than 24 hours, clearing it.`);
                            await AsyncStorage.removeItem(key);  // Clear the cache
                        }
                    }
                }
            } catch (error)
            {
                console.error('Error clearing old cache:', error);
            }
        };

        clearOldCache();
    }, []);

    useEffect(() => {
        const saveTheme = async () => {
            if (isDarkColorScheme) {
                await setItem('theme', 'dark');
            } else {
                await setItem('theme', 'light');
            }
        };

        saveTheme();
    }, [isDarkColorScheme]);

    if (!isColorSchemeLoaded) {
        return null;
    }

    return (
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
            <MapProvider>
                <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
                    <InitialLayout />
                </ClerkProvider>
                <PortalHost />
            </MapProvider>
        </ThemeProvider>
    );
}
