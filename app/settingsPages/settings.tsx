import React, { useState } from 'react';
import {ScrollView, SafeAreaView, View, StyleSheet, TouchableOpacity, Appearance} from 'react-native';
import { Text } from '@/components/ui/text';
import Icon from "react-native-vector-icons/Ionicons";
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { useAuth  } from '@clerk/clerk-expo';
import {router} from "expo-router";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {useTheme} from "@react-navigation/native";
import setColorScheme = Appearance.setColorScheme;



const Settings = () => {
    const theme = useTheme();
    const { signOut } = useAuth();

    const [isSignOutDialogVisible, setSignOutDialogVisible] = useState(false);

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

                {/* Change Profile pic Button */}
                <TouchableOpacity style={styles.optionButton} onPress={() => router.push('/settingsPages/setAvatar')}>
                    <Text style={styles.optionText}>Change Profile Picture</Text>
                    <Icon style={{ color: theme.colors.icon}} name="chevron-forward" size={20} color="#fff"/>
                </TouchableOpacity>

                {/* Change Username Button */}
                <TouchableOpacity style={styles.optionButton} onPress={() => router.push('/settingsPages/resetUsername')}>
                    <Text style={styles.optionText}>Change Username</Text>
                    <Icon style={{ color: theme.colors.icon}} name="chevron-forward" size={20} color="#fff"/>
                </TouchableOpacity>

                {/* Reset Password Button */}
                <TouchableOpacity style={styles.optionButton} onPress={() => router.push("/settingsPages/resetPassword")}>
                    <Text style={styles.optionText}>Reset Password</Text>
                    <Icon style={{ color: theme.colors.icon}} name="chevron-forward" size={20} color="#fff"/>
                </TouchableOpacity>


                {/* Delete Account Button */}
                <TouchableOpacity style={styles.optionButton} onPress={() => router.push("/settingsPages/deleteAccount")}>
                    <Text style={styles.optionText}>Delete Account</Text>
                    <Icon style={{ color: theme.colors.icon}} name="chevron-forward" size={20} color="#fff"/>
                </TouchableOpacity>


                {/* Sign Out Button */}
                <TouchableOpacity style={styles.optionButton} onPress={() => {
                    setSignOutDialogVisible(true)
                }}>
                    <Text style={styles.optionText}>Sign Out</Text>
                    <Icon style={{ color: theme.colors.icon}} name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>

                {/* Sign Out Confirmation Dialog */}
                <Dialog open={isSignOutDialogVisible} onOpenChange={setSignOutDialogVisible}>
                    <DialogContent>
                        <DialogHeader style={styles.dialog}>
                            <DialogTitle>Are you sure you want to sign out?</DialogTitle>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setSignOutDialogVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </DialogClose>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={() => {
                                    setSignOutDialogVisible(false);
                                    onSignOutPress();
                                }}
                            >
                                <Text style={styles.confirmButtonText}>Yes</Text>
                            </TouchableOpacity>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

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
    },
    scrollContainer: {
        padding: 20,
        paddingBottom: 60,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 30,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginVertical: 5,
    },
    optionText: {
        fontSize: 16,
    },
    modalContainer: {
        flex: 1,
        padding: 20,
    },
    passwordContainer: {
        width: "100%",
        marginVertical: 10,
        position: "relative",
    },
    passwordInput: {
        height: 50,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingRight: 40,
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
    cancelButton: {
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
    },
    confirmButton: {
        backgroundColor: '#d9534f',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 14,
    },
});


export default Settings;