import React, {useState} from "react";
import {StyleSheet, TextInput, TouchableOpacity, View} from "react-native";
import { Text } from '@/components/ui/text';
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {  useUser  } from '@clerk/clerk-expo';
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

const ResetUsername = () => {

    const theme = useTheme()
    const [newUsername, setNewUsername] = useState("");
    const [dialogVisible, setDialogVisible] = useState(false);
    const { user } = useUser()


    const onSaveUser = async () => {
        try {
            await user.update({
                username: newUsername,
            });
            setDialogVisible(true);
        } catch (e) {
            console.error('Error updating username:', e);
        }
    };



    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View>
                <View style={styles.close}>
                    <Text style={styles.viewText}>Change Username</Text>
                    <TouchableOpacity onPress={() => router.push("/(tabs)/settings")}>
                        <Icon style={styles.icon} name="close" size={20} color="#fff"/>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        placeholder="New Username"
                        value={newUsername}
                        onChangeText={setNewUsername}
                        style={styles.input}
                        placeholderTextColor="#9a9a9a"
                    />
                </View>

                <TouchableOpacity style={styles.resetButton} onPress={onSaveUser}>
                    <Text style={styles.resetButtonText}>Update Username</Text>
                </TouchableOpacity>

                <Dialog open={dialogVisible} onOpenChange={setDialogVisible}>
                    <DialogContent>
                        <DialogHeader style={styles.dialog}>
                            <DialogTitle>Username Updated</DialogTitle>
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
        color: '#fff',
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
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
        marginTop: 20,
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#fff',
    },
    dialog: {
        paddingTop: 15,
    },

})

export default ResetUsername;