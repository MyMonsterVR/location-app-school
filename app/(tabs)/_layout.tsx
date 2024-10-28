import { Tabs } from 'expo-router';

export default () => {
    return (
        <Tabs screenOptions={{ headerShown: false }}>
            <Tabs.Screen name="friends" />
            <Tabs.Screen name="map" />
            <Tabs.Screen name="settings" />
        </Tabs>
    );
};