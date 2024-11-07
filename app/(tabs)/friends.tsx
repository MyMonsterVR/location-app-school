import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, Pressable, TextInput, StyleSheet, View, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getItem } from "@/app/utils/AsyncStorage";
import Icon from "react-native-vector-icons/Ionicons";
import { Text } from '~/components/ui/text';

const ROOM_ID = 'room1'; // Room name
const SERVER_URL = 'http://20.157.195.19';

// Define types for message and user data
interface User {
    username: string;
    userID: number;
}

interface Message {
    userId: number;
    text: string;
    type: string;
    username?: string;
    sentByClient?: boolean; // Added flag to differentiate client messages
}

const Friends: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState<string>('');
    const [friends, setFriends] = useState<User[]>([{ username: 'test1', userID: 50 }, { username: 'test2', userID: 51 }]);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [userID, setUserID] = useState<number | null>(null);

    let ws = useRef<WebSocket | null>(null).current;

    useEffect(() => {
        const getUserData = async () => {
            const userId = await getItem('userId');
            setUserID(userId);
        };

        getUserData();
    }, []); // Fetch the user ID only once when the component mounts

    useEffect(() => {
        if (userID === null) return; // Wait until userID is available

        // WebSocket connection
        ws = new WebSocket(`${SERVER_URL}:8080/chat`);

        ws.onopen = () => {
            console.log('Connected to WebSocket server');
            // Join the room only after userID is available
            ws.send(JSON.stringify({ type: 'join', room: ROOM_ID, userId: userID }));
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'history') {
                setMessages(data.messages); // Fetch history on connect
            } else if (data.type === 'message' && data.sentByClient !== true) {
                // Only add messages that are NOT sent by the client
                setMessages((prevMessages) => [...prevMessages, data]);
            }
        };


        return () => {
            if (ws) ws.close();
        };
    }, [userID]); // WebSocket should only open once userID is available

    const scrollViewRef = useRef<ScrollView | null>(null);

    useEffect(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]); // This will scroll to the bottom whenever the messages change


    // Send message to backend
    const sendMessage = () => {
        if (message.trim() === '') return;

        // Send message to backend via HTTP API
        fetch(`${SERVER_URL}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                room: ROOM_ID,
                userId: userID ?? 0, // Make sure userId is sent
                text: message,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Message sent successfully:', data);
                // Add message to state, and mark it as sent by client
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { userId: userID ?? 0, text: message, type: 'message', sentByClient: true },
                ]);
                setMessage(''); // Clear input after sending
            })
            .catch((error) => {
                console.error('Error sending message:', error);
            });
    };


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.friendsList}>
                <Text style={styles.pageTitle}>Friends</Text>
                {friends.map((friend, index) => (
                    <Pressable key={index} onPress={() => setModalVisible(true)}>
                        <Text style={styles.friendItem}>{friend.username}</Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Modal with Navbar and Chat Area */}
            <Modal visible={modalVisible} animationType="slide">
                <View style={styles.modalContainer}>
                    {/* Navbar */}
                    <View style={styles.navbar}>
                        <Pressable onPress={() => setModalVisible(false)}>
                            <Icon name="arrow-back" size={24} color="#fff" />
                        </Pressable>
                        <Text style={styles.navbarTitle}>Friend Name</Text>
                    </View>

                    {/* Chat Area */}
                    <View style={styles.chatArea}>
                        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.messagesContainer}>
                            {messages.map((data, index) => {
                                const showUsername = index === 0 || messages[index - 1].userId !== data.userId;
                                return (
                                    <View
                                        key={index}
                                        style={[
                                            styles.messageContainer,
                                            data.userId === userID ? styles.userMessage : styles.otherUserMessage
                                        ]}
                                    >
                                        {data.userId !== userID && showUsername && (
                                            <View style={styles.messageHeader}>
                                                <Text style={styles.username}>{data.username || "Unknown"}</Text>
                                            </View>
                                        )}

                                        {data.userId === userID && showUsername && (
                                            <View style={styles.messageHeaderRight}>
                                                <Text style={styles.username}>{data.username || "Me"}</Text>
                                            </View>
                                        )}

                                        {/* Message Text */}
                                        <Text style={styles.messageText}>{data.text}</Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Message Input with Send Button */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Type a message..."
                            onSubmitEditing={sendMessage}
                            style={styles.input}
                        />
                        <Pressable onPress={sendMessage} style={styles.sendButton}>
                            <Icon name="send" size={24} color="#0078d4" />
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// Provided Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1c1c1c',
    },
    friendsList: {
        padding: 20,
        backgroundColor: '#2c2c2c',
    },
    pageTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#fff',
    },
    friendItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#444',
        paddingVertical: 10,
        fontSize: 18,
        color: '#fff',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#222',
    },
    navbar: {
        backgroundColor: '#333',
        paddingTop: 20,
        paddingBottom: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    navbarTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    chatArea: {
        flex: 1,
        padding: 10,
    },
    messagesContainer: {
        paddingBottom: 60, // To make room for the input area
    },
    messageContainer: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        marginLeft: 10,
        marginRight: 10,
        flexDirection: 'column',
        justifyContent: 'center',
    },
    userMessage: {
        backgroundColor: '#0078d4',
        alignSelf: 'flex-end',
    },
    otherUserMessage: {
        backgroundColor: '#333',
        alignSelf: 'flex-start',
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8, // Space between icon and message
    },
    messageHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8, // Space between icon and message
        justifyContent: 'flex-end',
    },
    username: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    messageText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 20,
    },
    inputContainer: {
        borderTopWidth: 1,
        borderTopColor: '#444',
        padding: 10,
        backgroundColor: '#333',
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingLeft: 15,
        paddingVertical: 10,
        fontSize: 16,
        flex: 1,
    },
    sendButton: {
        marginLeft: 10,
        padding: 8,
        borderRadius: 50,
    },
});

export default Friends;
