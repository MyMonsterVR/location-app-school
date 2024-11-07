import {Stack, useRouter, useSegments} from "expo-router";
import '@/global.css';
import {ClerkProvider, ClerkLoaded, useAuth} from '@clerk/clerk-expo'
import { Slot } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useEffect } from 'react'


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

export default function RootLayout() {
    return (
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
            <InitialLayout />
        </ClerkProvider>
    );
}
