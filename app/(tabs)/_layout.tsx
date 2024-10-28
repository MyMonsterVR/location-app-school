import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';


export default () => {
    return (
        <Tabs screenOptions={{ headerShown: false }}>
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
    );
};