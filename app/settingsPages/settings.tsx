import React, { useState } from 'react';
import { ScrollView, SafeAreaView, View, StyleSheet, TouchableOpacity, Appearance } from 'react-native';
import { Text } from '@/components/ui/text';
import Icon from "react-native-vector-icons/Ionicons";
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { useAuth } from '@clerk/clerk-expo';
import { router } from "expo-router";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTheme } from "@react-navigation/native";

const Settings = () => {
    const theme = useTheme();
    const { signOut } = useAuth();
    const [isSignOutDialogVisible, setSignOutDialogVisible] = useState(false);

    const onSignOutPress = async () => {
        try {
            await signOut();
        } catch (err) {
            console.error(err);
        }
    };

    const SettingItem = ({ icon, text, onPress, toggle }) => (
        <TouchableOpacity style={styles.settingItem(theme)} onPress={onPress}>
            <View style={styles.settingItemLeft}>
                <Icon name={icon} size={24} color={theme.colors.text} style={styles.settingIcon(theme)} />
                <Text style={styles.settingText}>{text}</Text>
            </View>
            {toggle ? toggle : <Icon name="chevron-forward" size={20} color={theme.colors.text} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={[styles.header, { color: theme.colors.text }]}>Account</Text>

                <SettingItem icon="person-circle" text="Change Profile Picture" onPress={() => router.push('/settingsPages/setAvatar')} />
                <SettingItem icon="at" text="Change Username" onPress={() => router.push('/settingsPages/resetUsername')} />
                <SettingItem icon="key" text="Reset Password" onPress={() => router.push("/settingsPages/resetPassword")} />
                <SettingItem icon="trash" text="Delete Account" onPress={() => router.push("/settingsPages/deleteAccount")} />
                <SettingItem icon="log-out" text="Sign Out" onPress={() => setSignOutDialogVisible(true)} />

                <Text style={[styles.header, { color: theme.colors.text }]}>Preferences</Text>

                <SettingItem
                    icon="moon"
                    text="Dark Mode"
                    toggle={<ToggleSwitch Option="toggleDarkMode" callback={(isDarkMode) => Appearance.setColorScheme(isDarkMode ? 'dark' : 'light')} />}
                />
                <SettingItem
                    icon="speedometer"
                    text="Use Mph"
                    toggle={<ToggleSwitch Option="toggleUnit" />}
                />
                <SettingItem
                    icon="location"
                    text="Show Location"
                    toggle={<ToggleSwitch Option="toggleLocation" />}
                />

                <Text style={[styles.header, { color: theme.colors.text }]}>Track</Text>
                <SettingItem
                    icon="analytics"
                    text="Track Mode"
                    toggle={<ToggleSwitch Option="toggleTrackMode" />}
                />
            </ScrollView>

            <Dialog open={isSignOutDialogVisible} onOpenChange={setSignOutDialogVisible}>
                <DialogContent style={[styles.dialogContent, { backgroundColor: theme.colors.card }]}>
                    <DialogHeader>
                        <DialogTitle style={{ color: theme.colors.text }}>Are you sure you want to sign out?</DialogTitle>
                    </DialogHeader>
                    <DialogFooter style={styles.dialogFooter}>
                        <DialogClose asChild>
                            <TouchableOpacity style={[styles.dialogButton, styles.cancelButton]} onPress={() => setSignOutDialogVisible(false)}>
                                <Text style={[styles.dialogButtonText, { color: theme.colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                        </DialogClose>
                        <TouchableOpacity style={[styles.dialogButton, styles.confirmButton]} onPress={() => { setSignOutDialogVisible(false); onSignOutPress(); }}>
                            <Text style={styles.dialogButtonText}>Yes, Sign Out</Text>
                        </TouchableOpacity>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        padding: 20,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 30,
        marginBottom: 15,
    },
    settingItem: (theme) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderColor,
    }),
    settingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingIcon: (theme) => ({
        marginRight: 15,
        color: theme.colors.icon,
    }),
    settingText: {
        fontSize: 16,
    },
    dialogContent: {
        borderRadius: 15,
        padding: 20,
    },
    dialogFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    dialogButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    confirmButton: {
        backgroundColor: '#d9534f',
    },
    dialogButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

export default Settings;