import React, {useState} from "react";
import {StyleSheet, TextInput, TouchableOpacity, View} from "react-native";
import { Text } from '@/components/ui/text';
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {useAuth, useUser} from '@clerk/clerk-expo';
import {router} from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

const DeleteAccount = () => {

    const theme = useTheme()
    const { user } = useUser()
    const SERVER_URL = `${process.env.EXPO_PUBLIC_SERVER_URL}`;
    const {userId, getToken} = useAuth();
    const { signOut } = useAuth();


    const deleteuser = async () => {
        try {
            const response = await fetch(`http://${SERVER_URL}/deleteUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await getToken()}`,
                },
                body: JSON.stringify({
                    userId
                }),
            });

            if (response.ok) {
                onSignOutPress();
            } else {
                console.error('Failed to delete user:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error occurred while deleting user:', error);
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
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View>
                <View style={styles.close}>
                    <Text style={styles.viewText}>Delete Account</Text>
                    <TouchableOpacity onPress={() => router.push("/(tabs)/settings")}>
                        <Icon style={{ color: theme.colors.icon}} name="close" size={20} color="#fff"/>
                    </TouchableOpacity>
                </View>

                <Dialog>
                    <DialogTrigger asChild>
                        <TouchableOpacity style={styles.resetButton}>
                            <Text style={styles.resetButtonText}>Delete</Text>
                        </TouchableOpacity>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader style={styles.dialog}>
                            <DialogTitle>Are You Sure You Want To Delete Your Account</DialogTitle>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <TouchableOpacity style={styles.resetButton} onPress={() => {
                                    deleteuser()
                                }}>
                                    <Text>Delete Account</Text>
                                </TouchableOpacity>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 30,
    },
    close: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    viewText: {
        fontSize: 20,
    },
    icon: {
        color: '#fff',
    },
    inputContainer: {
        marginTop: 20,
    },
    input: {
        backgroundColor: '#444',
        padding: 10,
        borderRadius: 5,
        color: '#fff',
    },
    resetButton: {
        backgroundColor: '#d9534f',
        padding: 10,
        borderRadius: 5,
        marginTop: 30,
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#fff',
    },
    dialog: {
        paddingTop: 15,
    },

})

export default DeleteAccount;