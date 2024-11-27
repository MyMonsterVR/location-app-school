import React from 'react';
import { View, StyleSheet } from "react-native";
import { Image } from 'expo-image';
import ProfilePicture from "@/components/ProfilePicture";

const FriendMarker = ({ userId }) => {
    return (
        <View style={styles.markerContainer}>
            <ProfilePicture userId={userId} styling={styles.profileImage} />
        </View>
    );
};

const styles = StyleSheet.create({
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 50, // Width of container
        height: 50, // Height of container
        overflow: 'hidden', // Ensures anything outside of this bounds is hidden
        borderRadius: 25, // Optional: to ensure the container is circular too
    },
});

export default FriendMarker;