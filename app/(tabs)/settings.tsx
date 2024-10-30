import {View, Text, StyleSheet} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {ToggleSwitch} from '@/components/ToggleSwitch';
import Icon from "react-native-vector-icons/Ionicons";

const Settings = () => {
    return (
        <SafeAreaView>
            <View>
                <Text style={styles.settingsHeader}>Account</Text>
                <View style={styles.settingsButtonView}>
                    <Text style={styles.settingsOptions}>Change Username</Text>
                    <Icon style={styles.settingsButton} name="chevron-forward" size={20} color="black"/>
                </View>
                <View style = {styles.lineStyle} />
                <View style={styles.settingsButtonView}>
                    <Text style={styles.settingsOptions}>Reset Password</Text>
                    <Icon style={styles.settingsButton} name="chevron-forward" size={20} color="black"/>
                </View>
                <View style = {styles.lineStyle} />
                <View style={styles.settingsButtonView}>
                    <Text style={styles.settingsOptions}>Delete Account</Text>
                    <Icon style={styles.settingsButton} name="chevron-forward" size={20} color="black"/>
                </View>

                <Text style={styles.settingsHeader}>Friends</Text>
                <View style={styles.settingsButtonView}>
                    <Text style={styles.settingsOptions}>QR Code/link</Text>
                    <Icon style={styles.settingsButton} name="chevron-forward"/>
                </View>

                <Text style={styles.settingsHeader}>Preferences</Text>
                <View style={styles.settingsButtonView}>
                    <Text style={styles.settingsOptions}>Light / Dark mode</Text>
                    <ToggleSwitch Option={"toggleDarkMode"}/>
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

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    settingsHeader: {
        fontSize: 25,
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