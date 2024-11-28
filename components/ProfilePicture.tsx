import React, { useEffect, useState } from 'react';
import { Image, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from "@react-navigation/native";

// Function to fetch the profile picture from your backend
const getUserProfileImage = async (userId: string): Promise<string | null> => {
    try {
        const response = await fetch(`http://${process.env.EXPO_PUBLIC_SERVER_URL}/user/${userId}`);
        const data = await response.json();
        return data.imageUrl || null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null; // Return null if there's an error
    }
};

const ProfilePicture: React.FC<{ userId: string, styling?: Record<string, string|number> }> = ({ userId, styling }) => {
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const theme = useTheme();

    useEffect(() => {
        const fetchProfileImage = async () => {
            setLoading(true);
            const imageUrl = await getUserProfileImage(userId);
            setProfileImage(imageUrl);
            setLoading(false);
        };

        fetchProfileImage();
    }, [userId]);

    // @ts-ignore
    return (
        <View>
            {loading ? (
                <ActivityIndicator size="large" color="#fff" />
            ) : profileImage ? (
                <Image style={[styles.profileImage(theme), styling]} source={{ uri: profileImage }} />
            ) : (
                <Icon name="person-circle" size={45} color="#fff" />
                )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImage: (theme) => ({
        width: 45,
        height: 45,
        borderRadius: 50,
        resizeMode: 'cover',
        borderWidth: 2,
        borderColor: theme.colors.icon,
    }),
});

export default ProfilePicture;
