import { View, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import Spinner from 'react-native-loading-spinner-overlay';
import { useState } from 'react';
import { Stack } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';

const Register = () => {
    const { isLoaded, signUp, setActive } = useSignUp();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    const onSignUpPress = async () => {
        if (!isLoaded || password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        setLoading(true);

        try {
            await signUp.create({
                emailAddress,
                username,
                password,
            });
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setPendingVerification(true);
        } catch (err: any) {
            alert(err.errors[0].message);
        } finally {
            setLoading(false);
        }
    };

    const onPressVerify = async () => {
        if (!isLoaded) return;
        setLoading(true);

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
            if (completeSignUp.createdSessionId) {
                await setActive({ session: completeSignUp.createdSessionId });
            } else {
                alert('Failed to create a session. Please try again.');
            }
        } catch (err) {
            console.error(err);
            alert(err.errors?.[0]?.message || 'An error occurred during verification');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerBackVisible: !pendingVerification }} />
            <Spinner visible={loading} />

            <Image source={require('@/assets/images/WayLoc.png')} style={styles.logo} />

            {!pendingVerification && (
                <>
                    <TextInput
                        autoCapitalize="none"
                        placeholder="Email"
                        value={emailAddress}
                        onChangeText={setEmailAddress}
                        style={styles.inputField}
                        placeholderTextColor="#9a9a9a"
                    />
                    <TextInput
                        placeholder="Username"
                        value={username}
                        onChangeText={setUsername}
                        style={styles.inputField}
                        placeholderTextColor="#9a9a9a"
                    />

                    <View style={styles.passwordContainer}>
                        <TextInput
                            placeholder="Password"
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

                    <View style={styles.passwordContainer}>
                        <TextInput
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!confirmPasswordVisible}
                            style={styles.passwordInput}
                            placeholderTextColor="#9a9a9a"
                        />
                        <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)} style={styles.eyeIcon}>
                            <Ionicons name={confirmPasswordVisible ? 'eye-off' : 'eye'} size={24} color="#9a9a9a" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={onSignUpPress} style={styles.signUpButton}>
                        <Text style={styles.signUpButtonText}>Sign Up</Text>
                    </TouchableOpacity>
                </>
            )}

            {pendingVerification && (
                <>
                    <TextInput
                        value={code}
                        placeholder="Verification Code"
                        style={styles.inputField}
                        onChangeText={setCode}
                        placeholderTextColor="#9a9a9a"
                    />
                    <TouchableOpacity onPress={onPressVerify} style={styles.signUpButton}>
                        <Text style={styles.signUpButtonText}>Verify Email</Text>
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
        borderColor: '#d1d5db',
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
    signUpButton: {
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
    signUpButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default Register;
