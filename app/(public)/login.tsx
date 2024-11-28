import { useSignIn } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Image } from "react-native";
import { TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import Spinner from "react-native-loading-spinner-overlay";
import { Ionicons } from "@expo/vector-icons";

const Login = () => {
    const { signIn, setActive, isLoaded } = useSignIn();
    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setPasswordVisible] = useState(false);

    const onSignInPress = async () => {
        if (!isLoaded) {
            return;
        }
        setLoading(true);
        try {
            const completeSignIn = await signIn.create({
                identifier: emailAddress,
                password,
            });
            await setActive({ session: completeSignIn.createdSessionId });
        } catch (err: any) {
            alert(err.errors[0].message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Spinner visible={loading} />

            <Image source={require('@/assets/images/WayLoc.png')} style={styles.logo} />

            <TextInput
                autoCapitalize="none"
                placeholder="Email"
                value={emailAddress}
                onChangeText={setEmailAddress}
                style={styles.inputField}
                placeholderTextColor="#9a9a9a"
            />

            <View style={styles.passwordContainer}>
                <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    style={styles.passwordInput}
                    placeholderTextColor="#9a9a9a"
                />
                <TouchableOpacity
                    onPress={() => setPasswordVisible(!isPasswordVisible)}
                    style={styles.eyeIcon}
                >
                    <Ionicons name={isPasswordVisible ? "eye-off" : "eye"} size={20} color="#9a9a9a" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onSignInPress} style={styles.loginButton}>
                <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            <Link href={'/reset'} asChild>
                <Pressable style={styles.linkButton}>
                    <Text style={styles.linkText}>Forgot Password?</Text>
                </Pressable>
            </Link>

            <Link href={'/register'} asChild>
                <Pressable style={styles.linkButton}>
                    <Text style={styles.linkText}>Create Account</Text>
                </Pressable>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#f3f4f6",
    },
    inputField: {
        width: "100%",
        marginVertical: 10,
        height: 50,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingHorizontal: 10,
        backgroundColor: "#ffffff",
        fontSize: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
    loginButton: {
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
    loginButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },

    logo: {
        alignSelf: "center",
        marginBottom: 60,
        width: 250,
        height: 250,
        resizeMode: "contain",
    },
    linkButton: {
        marginTop: 5,
    },
    linkText: {
        color: "#1f2937",
        fontSize: 14,
    },
});

export default Login;
