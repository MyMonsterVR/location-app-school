import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View, Image, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const SERVER_URL = `${process.env.EXPO_PUBLIC_SERVER_URL}`;

const SetAvatar = () => {
    const theme = useTheme();
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const { user } = useUser();

    const handlePickAndUploadImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== "granted") {
            alert("Permission to access media library is required!");
            return;
        }

        try {
            // Step 1: Pick the image
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                const base64 = result.assets[0].base64; // Get the base64 string from the picked image
                const mimeType = result.assets[0].mimeType; // Get the MIME type of the image (e.g., image/jpeg)

                const image = `data:${mimeType};base64,${base64}`; // Format the base64 string into a proper data URI

                console.log(image);

                setImage(result.assets[0].uri); // Optionally set the image URI for preview
                setUploading(true);

                // Step 2: Upload the base64 image to the server
                try {
                    await user?.setProfileImage({
                        file: image, // Send the base64 string as the image file
                    });

                    setDialogVisible(true); // Show success dialog
                } catch (uploadError) {
                    console.error("Error uploading image:", uploadError);
                    alert("Failed to upload image.");
                } finally {
                    setUploading(false);
                }
            }
        } catch (error) {
            console.error("Error picking or uploading image:", error);
            alert("Something went wrong while picking or uploading the image.");
        }
    };



    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View>
                <View style={styles.close}>
                    <Text style={styles.viewText}>Set Avatar</Text>
                    <TouchableOpacity onPress={() => router.push("/(tabs)/settings")}>
                        <Icon style={styles.icon} name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.imageContainer}>
                    {image ? (
                        <Image
                            source={{ uri: image }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <Text style={styles.placeholderText}>No image selected</Text>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handlePickAndUploadImage}
                    disabled={uploading}
                >
                    {uploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.resetButtonText}>Pick and Upload Image</Text>
                    )}
                </TouchableOpacity>

                <Dialog open={dialogVisible} onOpenChange={setDialogVisible}>
                    <DialogContent>
                        <DialogHeader style={styles.dialog}>
                            <DialogTitle>Image Uploaded</DialogTitle>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={() => router.push("/(tabs)/settings")}
                                >
                                    <Text>OK</Text>
                                </TouchableOpacity>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 30,
    },
    close: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    viewText: {
        fontSize: 20,
    },
    imageContainer: {
        marginTop: 20,
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        height: 360,
        width: 360,
        borderRadius: 180,
        overflow: "hidden",
        backgroundColor: "#222",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
        borderRadius: 180,
        alignSelf: "center",
    },
    placeholderText: {
        fontSize: 16,
    },
    resetButton: {
        backgroundColor: "#007bff",
        padding: 10,
        borderRadius: 5,
        marginTop: 20,
        alignItems: "center",
    },
    resetButtonText: {
        color: "#fff",
    },
    dialog: {
        paddingTop: 15,
    },
});

export default SetAvatar;
