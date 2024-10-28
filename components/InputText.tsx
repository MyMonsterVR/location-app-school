import React, { useState } from 'react';
import {Pressable, TextInput, Text, View, StyleSheet, Dimensions} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const InputText = ({ addMessage }) => {
    const [message, setMessage] = useState('');
    const sendMessage = () => {
        addMessage(message);
        setMessage('');
    }

    return (
        <View style={styles.container}>
            <TextInput style={styles.input} onChangeText={(e) => setMessage(e)} value={message} />
            <Pressable onPress={sendMessage} style={styles.sendButton}>
                <Icon name="send" size={24} color="#FFF" />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#FFF',
        width: Dimensions.get('window').width,
        borderTopWidth: 1,
        borderColor: '#ccc',
    },
    input: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingHorizontal: 10,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: '#34a4eb',
        borderRadius: 20,
        padding: 10,
    },
});

export default InputText;