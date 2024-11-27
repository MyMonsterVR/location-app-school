import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Text } from '@/components/ui/text';
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from '@clerk/clerk-expo';
import { router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Ionicons } from "@expo/vector-icons";

const ResetPassword = () => {
    const theme = useTheme();
    const [newPassword, setNewPassword] = useState("");
    const [isNewPasswordVisible, setNewPasswordVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [isCurrentPasswordVisible, setCurrentPasswordVisible] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const { user } = useUser();

    const handleUpdatePassword = async () => {
        try {
            await user.updatePassword({ currentPassword, newPassword });
            setDialogVisible(true);
        } catch (error) {
            console.error("Failed to update password:", error);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View>
                <View style={styles.close}>
                    <Text style={styles.viewText}>Reset Password</Text>
                    <TouchableOpacity onPress={() => router.push("/(tabs)/settings")}>
                        <Icon style={styles.icon} name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.passwordContainer}>
                    <TextInput
                        placeholder="Current Password"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry={!isCurrentPasswordVisible}
                        style={styles.passwordInput}
                        placeholderTextColor="#9a9a9a"
                    />
                    <TouchableOpacity
                        onPress={() => setCurrentPasswordVisible(!isCurrentPasswordVisible)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons name={isCurrentPasswordVisible ? "eye-off" : "eye"} size={20} color="#9a9a9a" />
                    </TouchableOpacity>
                </View>

                <View style={styles.passwordContainer}>
                    <TextInput
                        placeholder="New Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!isNewPasswordVisible}
                        style={styles.passwordInput}
                        placeholderTextColor="#9a9a9a"
                    />
                    <TouchableOpacity
                        onPress={() => setNewPasswordVisible(!isNewPasswordVisible)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons name={isNewPasswordVisible ? "eye-off" : "eye"} size={20} color="#9a9a9a" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.resetButton} onPress={handleUpdatePassword}>
                    <Text style={styles.resetButtonText}>Update Password</Text>
                </TouchableOpacity>

                <Dialog open={dialogVisible} onOpenChange={setDialogVisible}>
                    <DialogContent>
                        <DialogHeader style={styles.dialog}>
                            <DialogTitle>Password Updated</DialogTitle>
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
    viewText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "600",
    },
    icon: {
        color: "#fff",
    },
    passwordContainer: {
        width: "100%",
        marginVertical: 10,
        position: "relative",
    },
    passwordInput: {
        height: 50,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingRight: 40,
        backgroundColor: "#ffffff",
        fontSize: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    eyeIcon: {
        position: "absolute",
        right: 15,
        top: 15,
    },
    resetButton: {
        width: "100%",
        backgroundColor: "#0086d0",
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: "center",
        marginVertical: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    resetButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },
    close: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dialog: {
        paddingTop: 15,
    },
});

export default ResetPassword;