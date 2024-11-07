import {View, StyleSheet, Modal} from 'react-native';
import { Text } from '@/components/ui/text';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {ToggleSwitch} from '@/components/ToggleSwitch';
import Icon from "react-native-vector-icons/Ionicons";
import { TouchableOpacity } from 'react-native';
import {GestureHandlerRootView} from "react-native-gesture-handler";
import { useState, useEffect } from 'react';
import {useColorScheme} from "@/lib/useColorScheme";
import {SignOutButton} from "@clerk/clerk-react";
import {useAuth} from '@clerk/clerk-expo'

const Settings = () => {
    const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();

    const [isQRCodeModalVisible, setIsQRCodeModalVisible] = useState(false);
    const [IsDeleteAccountModalVisible, setIsDeleteAccountModalVisible] = useState(false);
    const [IsResetPasswordModalVisible, setIsResetPasswordModalVisible] = useState(false);
    const [IsChangeUsernameModalVisible, setIsChangeUsernameModalVisible] = useState(false);

    const { getToken, signOut } = useAuth();
    const onSignOutPress = async () => {
        try {
            await signOut();
        } catch (err: any) {
        }
    };


    console.log(isQRCodeModalVisible);


    return (
        <GestureHandlerRootView>
            <SafeAreaView>
                <View>
                    <Text style={styles.settingsHeader}>Account</Text>
                    <TouchableOpacity style={styles.settingsButtonView} onPress={() => setIsChangeUsernameModalVisible(true)}>
                        <Text style={styles.settingsOptions}>Change Username</Text>
                        <Icon style={styles.settingsButton} name="chevron-forward" size={20} color="black"/>
                    </TouchableOpacity>
                    <Modal visible={IsChangeUsernameModalVisible} animationType="slide">
                        <View>
                            <Text>Change Username</Text>
                            <TouchableOpacity style={styles.settingsButtonView} onPress={() => setIsChangeUsernameModalVisible(false)}>
                                <Text style={styles.settingsOptions}>Close</Text>
                                <Icon style={styles.settingsButton} name="chevron-forward" size={20} color="black"/>
                            </TouchableOpacity>
                        </View>
                    </Modal>

                    <View style = {styles.lineStyle} />
                    <TouchableOpacity style={styles.settingsButtonView} onPress={() => setIsResetPasswordModalVisible(true)}>
                        <Text style={styles.settingsOptions}>Reset Password</Text>
                        <Icon style={styles.settingsButton} name="chevron-forward" size={20} color="black"/>
                    </TouchableOpacity>
                    <Modal visible={IsResetPasswordModalVisible} animationType="slide">
                        <View>
                            <Text>Reset Password</Text>
                            <TouchableOpacity style={styles.settingsButtonView} onPress={() => setIsResetPasswordModalVisible(false)}>
                                <Text style={styles.settingsOptions}>Close</Text>
                                <Icon style={styles.settingsButton} name="chevron-forward" size={20} color="black"/>
                            </TouchableOpacity>
                        </View>
                    </Modal>

                    <View style = {styles.lineStyle} />
                    <TouchableOpacity style={styles.settingsButtonView} onPress={() => setIsDeleteAccountModalVisible(true)}>
                        <Text style={styles.settingsOptions}>Delete Account</Text>
                        <Icon style={styles.settingsButton} name="chevron-forward" size={20} color="black"/>
                    </TouchableOpacity>
                    <Modal visible={IsDeleteAccountModalVisible} animationType="slide">
                        <View>
                            <Text>Delete Account</Text>
                            <TouchableOpacity style={styles.settingsButtonView} onPress={() => setIsDeleteAccountModalVisible(false)}>
                                <Text style={styles.settingsOptions}>Close</Text>
                                <Icon style={styles.settingsButton} name="chevron-forward" size={20} color="black"/>
                            </TouchableOpacity>
                        </View>
                    </Modal>

                    <View style = {styles.lineStyle} />
                    <TouchableOpacity style={styles.settingsButtonView} onPress={() => onSignOutPress()}>
                        <Text style={styles.settingsOptions}>Sign Out</Text>
                        <Icon style={styles.settingsButton} name="chevron-forward" size={20} color="black"/>
                    </TouchableOpacity>

                    <Text style={styles.settingsHeader}>Friends</Text>
                    <TouchableOpacity style={styles.settingsButtonView} onPress={() => setIsQRCodeModalVisible(true)}>
                        <Text style={styles.settingsOptions}>QR Code/link</Text>
                        <Icon style={styles.settingsButton} name="chevron-forward" size={20} color="black"/>
                    </TouchableOpacity>
                    <Modal visible={isQRCodeModalVisible} animationType="slide">
                        <View>
                            <Text>QR Code</Text>
                            <TouchableOpacity style={styles.settingsButtonView} onPress={() => setIsQRCodeModalVisible(false)}>
                                <Text style={styles.settingsOptions}>Close</Text>
                                <Icon style={styles.settingsButton} name="chevron-forward" size={20} color="black"/>
                            </TouchableOpacity>
                        </View>
                    </Modal>

                    <Text style={styles.settingsHeader}>Preferences</Text>
                    <View style={styles.settingsButtonView}>
                        <Text style={styles.settingsOptions}>Light / Dark mode</Text>
                        <ToggleSwitch Option={"toggleDarkMode"} callback={(isDarkMode) => setColorScheme(isDarkMode === true ? 'dark' : 'light')}/>
                    </View>
                    <View style = {styles.lineStyle} />
                    <View style={styles.settingsButtonView}>
                        <Text style={styles.settingsOptions}>Kmph / Mph</Text>
                        <ToggleSwitch Option={"toggleUnit"}/>
                    </View>
                    <View style = {styles.lineStyle} />
                    <View style={styles.settingsButtonView}>
                        <Text style={styles.settingsOptions}>Show Location</Text>
                        <ToggleSwitch Option={"toggleLocation"}/>
                    </View>
                    <Text style={styles.settingsHeader}>Track</Text>
                    <View style={styles.settingsButtonView}>
                        <Text style={styles.settingsOptions}>Track mode</Text>
                        <ToggleSwitch Option={"toggleTrackMode"}/>
                    </View>
                </View>
            </SafeAreaView>
        </GestureHandlerRootView>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    settingsHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginLeft: 15,
        marginBottom: 5,
    },
    settingsOptions: {
        fontSize: 15,
        marginLeft: 15,
    },
    settingsButton: {
        marginRight: 10,
    },
    settingsButtonView: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lineStyle:{
        borderWidth: 0.5,
        borderColor:'lightgrey',
        margin:5,
        marginHorizontal: 15,
    },
});

export default Settings;