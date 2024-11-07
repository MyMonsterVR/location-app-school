import React from 'react';
import { Stack } from 'expo-router';

const PuplicLayout = () => {
    return (
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
    );
}