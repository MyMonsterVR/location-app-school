import { View, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';

const PwReset = () => {
    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [successfulCreation, setSuccessfulCreation] = useState(false);
    const { signIn, setActive } = useSignIn();
    const [passwordVisible, setPasswordVisible] = useState(false);

    const onRequestReset = async () => {
        try {
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier: emailAddress,
            });
            setSuccessfulCreation(true);
        } catch (err: any) {
            alert(err.errors[0].message);
        }
    };

    const onReset = async () => {
        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code,
                password,
            });
            alert('Password reset successfully');
            await setActive({ session: result.createdSessionId });
        } catch (err: any) {
            alert(err.errors[0].message);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerBackVisible: !successfulCreation }} />

            <Image source={require('@/assets/images/WayLoc.png')} style={styles.logo} />

            {!successfulCreation && (
                <>
                    <TextInput
                        autoCapitalize="none"
                        placeholder="Email"
                        value={emailAddress}
                        onChangeText={setEmailAddress}
                        style={styles.inputField}
                        placeholderTextColor="#9a9a9a"
                    />
                    <TouchableOpacity onPress={onRequestReset} style={styles.button}>
                        <Text style={styles.buttonText}>Send Reset Email</Text>
                    </TouchableOpacity>
                </>
            )}

            {successfulCreation && (
                <>
                    <TextInput
                        value={code}
                        placeholder="Verification Code"
                        style={styles.inputField}
                        onChangeText={setCode}
                        placeholderTextColor="#9a9a9a"
                    />

                    <View style={styles.passwordContainer}>
                        <TextInput
                            placeholder="New Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!passwordVisible}
                            style={styles.passwordInput}
                            placeholderTextColor="#9a9a9a"
                        />
                        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.eyeIcon}>
                            <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={24} color="#9a9a9a" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={onReset} style={styles.button}>
                        <Text style={styles.buttonText}>Set New Password</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f3f4f6',
    },
    logo: {
        alignSelf: 'center',
        marginBottom: 60,
        width: 250,
        height: 250,
        resizeMode: 'contain',
    },
    inputField: {
        width: '100%',
        marginVertical: 10,
        height: 50,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        paddingHorizontal: 10,
        backgroundColor: '#ffffff',
        fontSize: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    passwordContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#03adfc',
        borderRadius: 10,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    passwordInput: {
        flex: 1,
        height: 50,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    eyeIcon: {
        paddingHorizontal: 10,
    },
    button: {
        width: '100%',
        backgroundColor: '#0086d0',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default PwReset;
