import { Tabs } from 'expo-router';

export default () => {
    return (
        <Tabs>
            <Tabs.Screen name="friends" />
            <Tabs.Screen name="map" />
            <Tabs.Screen name="settings" />
        </Tabs>
    );
};