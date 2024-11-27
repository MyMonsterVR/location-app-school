import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View, Image, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

const SetAvatar = () => {
    const theme = useTheme();
    const { user } = useUser();

    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Function to pick an image from the device's gallery
    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== "granted") {
            alert("Permission to access media library is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.cancelled) {
            setImage(result.uri);
        }
    };

    // Function to upload the picked image
    const uploadImage = async () => {
        if (!image) {
            alert("Please select an image first.");
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append("avatar", {
            uri: image,
            name: "avatar.jpg",
            type: "image/jpeg",
        });

        try {
            const response = await axios.post("http://your-backend-url.com/user/avatarimg", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            alert("Image uploaded successfully!");
            console.log("Upload success:", response.data);

            router.push("/(tabs)/settings");
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} style={styles.icon} />
                </TouchableOpacity>
                <Text style={styles.title}>
                    Set Avatar
                </Text>
            </View>

            {/* Image Preview */}
            <View style={styles.imageContainer}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.image} />
                ) : (
                    <Text style={styles.placeholderText}>No image selected</Text>
                )}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={pickImage}>
                    <Text style={styles.buttonText}>Pick Image</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={uploadImage} disabled={uploading}>
                    {uploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Upload Image</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    icon: {
        color: "#fff",
        marginRight: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
    imageContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 30,
        height: 200,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
    },
    image: {
        width: "100%",
        height: "100%",
        borderRadius: 10,
    },
    placeholderText: {
        color: "#aaa",
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 20,
    },
    button: {
        backgroundColor: "#007bff",
        padding: 15,
        borderRadius: 5,
        marginBottom: 10,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
    },
});

export default SetAvatar;
