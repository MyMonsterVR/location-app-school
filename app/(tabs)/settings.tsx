import React, { useState } from 'react';
import {ScrollView, SafeAreaView, View, StyleSheet, Modal, TouchableOpacity, TextInput} from 'react-native';
import { Text } from '@/components/ui/text';
import Icon from "react-native-vector-icons/Ionicons";
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { useColorScheme } from "@/lib/useColorScheme";
import { useAuth, useUser  } from '@clerk/clerk-expo';
import {Ionicons} from "@expo/vector-icons";



const Settings = () => {
    const { setColorScheme } = useColorScheme();
    const [isQRCodeModalVisible, setIsQRCodeModalVisible] = useState(false);
    const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] = useState(false);
    const [isResetPasswordModalVisible, setIsResetPasswordModalVisible] = useState(false);
    const [isChangeUsernameModalVisible, setIsChangeUsernameModalVisible] = useState(false);
    const { user } = useUser()
    const { signOut } = useAuth();

    const [newPassword, setNewPassword] = useState("");
    const [isNewPasswordVisible, setNewPasswordVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [isCurrentPasswordVisible, setCurrentPasswordVisible] = useState(false);

    const [newUsername, setNewUsername] = useState("");


    const onSaveUser = async () => {
        try {
            // This is not working!
            const result = await user.update({
                username: newUsername,
            });

        } catch (e) {
            console.log('🚀 ~ file: profile.tsx:18 ~ onSaveUser ~ e', JSON.stringify(e));
        }
    };


    const onSignOutPress = async () => {
        try {
            await signOut();
        } catch (err: any) {
            console.error(err);
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.header}>Account</Text>

                {/* Change Username Button */}
                <TouchableOpacity style={styles.optionButton} onPress={() => setIsChangeUsernameModalVisible(true)}>
                    <Text style={styles.optionText}>Change Username</Text>
                    <Icon style={styles.icon} name="chevron-forward" size={20} color="#fff"/>
                </TouchableOpacity>

                <Modal visible={isChangeUsernameModalVisible} animationType="slide">
                    <View style={styles.modalContainer}>
                        <View style={styles.close}>
                            <Text style={styles.modalText}>Change Username</Text>
                            <TouchableOpacity onPress={() => setIsChangeUsernameModalVisible(false)}>
                                <Icon style={styles.icon} name="close" size={20} color="#fff"/>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.passwordContainer}>
                            <TextInput
                                placeholder="New Username"
                                value={newUsername}
                                onChangeText={setNewUsername}
                                style={styles.passwordInput}
                                placeholderTextColor="#9a9a9a"
                            />
                        </View>

                        <TouchableOpacity onPress={() => {
                            onSaveUser()
                            setIsChangeUsernameModalVisible(false)
                        }} style={styles.resetButton}>
                            <Text style={styles.resetButtonText}>Update Username</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>

                {/* Reset Password Button */}
                <TouchableOpacity style={styles.optionButton} onPress={() => setIsResetPasswordModalVisible(true)}>
                    <Text style={styles.optionText}>Reset Password</Text>
                    <Icon style={styles.icon} name="chevron-forward" size={20} color="#fff"/>
                </TouchableOpacity>

                <Modal visible={isResetPasswordModalVisible} animationType="slide">
                    <View style={styles.modalContainer}>
                        <View style={styles.close}>
                            <Text style={styles.modalText}>Reset Password</Text>
                            <TouchableOpacity onPress={() => setIsResetPasswordModalVisible(false)}>
                                <Icon style={styles.icon} name="close" size={20} color="#fff"/>
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

                        <TouchableOpacity onPress={() => {
                            user.updatePassword({currentPassword, newPassword})
                            setIsResetPasswordModalVisible(false)
                        }} style={styles.resetButton}>
                            <Text style={styles.resetButtonText}>Update Password</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>

                {/* Delete Account Button */}
                <TouchableOpacity style={styles.optionButton} onPress={() => setIsDeleteAccountModalVisible(true)}>
                    <Text style={styles.optionText}>Delete Account</Text>
                    <Icon style={styles.icon} name="chevron-forward" size={20} color="#fff"/>
                </TouchableOpacity>
                <Modal visible={isDeleteAccountModalVisible} animationType="slide">
                    <View style={styles.modalContainer}>
                        <View style={styles.close}>
                            <Text style={styles.modalText}>Delete Account</Text>
                            <TouchableOpacity onPress={() => setIsDeleteAccountModalVisible(false)}>
                                <Icon style={styles.icon} name="close" size={20} color="#fff"/>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Sign Out Button */}
                <TouchableOpacity style={styles.optionButton} onPress={onSignOutPress}>
                    <Text style={styles.optionText}>Sign Out</Text>
                    <Icon style={styles.icon} name="chevron-forward" size={20} color="#fff"/>
                </TouchableOpacity>

                <Text style={styles.header}>Preferences</Text>

                {/* Dark Mode Toggle */}
                <View style={styles.optionButton}>
                    <Text style={styles.optionText}>Light / Dark Mode</Text>
                    <ToggleSwitch Option={"toggleDarkMode"} callback={(isDarkMode) => setColorScheme(isDarkMode === true ? 'dark' : 'light')} />
                </View>

                {/* Other Settings */}
                <View style={styles.optionButton}>
                    <Text style={styles.optionText}>Kmph / Mph</Text>
                    <ToggleSwitch Option={"toggleUnit"} />
                </View>
                <View style={styles.optionButton}>
                    <Text style={styles.optionText}>Show Location</Text>
                    <ToggleSwitch Option={"toggleLocation"} />
                </View>

                <Text style={styles.header}>Track</Text>
                <View style={styles.optionButton}>
                    <Text style={styles.optionText}>Track Mode</Text>
                    <ToggleSwitch Option={"toggleTrackMode"} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    scrollContainer: {
        padding: 20,
        paddingBottom: 60,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 30,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: '#1f1f1f',
        borderRadius: 10,
        marginVertical: 5,
    },
    optionText: {
        fontSize: 16,
        color: '#fff',
    },
    icon: {
        color: '#fff',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#1c1c1c',
        padding: 20,
    },
    modalText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
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
});

export default Settings;