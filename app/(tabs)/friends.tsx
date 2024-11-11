import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, Pressable, TextInput, StyleSheet, View, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from "react-native-vector-icons/Ionicons";
import { Text } from '~/components/ui/text';
import { useAuth } from '@clerk/clerk-expo';

const SERVER_URL = 'http://20.157.195.19';

// Define types for message and user data
interface User {
    username: string;
    userId: string;  // User ID should be a string (could be numeric or UUID)
}

interface Message {
    userId: string;
    text: string;
    type: string;
    username?: string;
    sentByClient?: boolean; // Flag to differentiate client messages
}

// Utility function to create a room ID dynamically
const createRoomId = (userIds: string[]): string => {
    // Sort user IDs to ensure consistent room ID generation
    const sortedUserIds = userIds.sort();
    return `room-${sortedUserIds.join('-')}`;
};

const Friends: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState<string>('');
    const [friends, setFriends] = useState<User[]>([
        { username: 'willer fake', userId: 'user_2oWHzUce33wlLHl4taHPaYpeIYn' },
        { username: 'raller fake', userId: 'user_2oWWxEKyYTXW1HD21yPggkAlYjx' },
        { username: 'test3', userId: 'user3' },
    ]);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [roomId, setRoomId] = useState<string>('');
    const { userId } = useAuth();  // Assuming Clerk's useAuth hook provides the current user ID

    let ws = useRef<WebSocket | null>(null).current;

    console.log(userId)

    useEffect(() => {
        if (!userId || !roomId) return; // Wait until userId and roomId are available

        // Initialize WebSocket connection if it's not already established
        if (!ws) {
            ws = new WebSocket(`${SERVER_URL}:8080/chat`);
        }

        ws.onopen = () => {
            console.log('Connected to WebSocket server');
            // Join the room based on the dynamic roomId and userId
            ws.send(JSON.stringify({ type: 'join', room: roomId, userId }));
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'history') {
                setMessages(data.messages); // Fetch history on connect
            } else if (data.type === 'message' && data.sentByClient !== true) {
                setMessages((prevMessages) => [...prevMessages, data]);
            }
        };

        return () => {
            // Optionally close WebSocket connection when the component is unmounted or roomId changes
            // ws.close();
        };
    }, [userId, roomId]); // Reconnect when userId or roomId changes

    const scrollViewRef = useRef<ScrollView | null>(null);

    useEffect(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]); // This will scroll to the bottom whenever messages change

    // Handle the room selection (either one-on-one or group chat)
    const onSelectChat = (selectedUsers: User[]) => {
        // Create room ID based on the selected users
        const userIds = selectedUsers.map(user => user.userId);
        if (userId && !userIds.includes(userId)) {
            userIds.push(userId);  // Ensure the current user is included in the room
        }

        const newRoomId = createRoomId(userIds);
        setRoomId(newRoomId);
        setModalVisible(true);
    };

    // Send a message to the backend and update state
    const sendMessage = () => {
        if (!message.trim()) return;

        // Send message via HTTP request
        fetch(`${SERVER_URL}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                room: roomId,
                userId: userId ?? '', // Ensure userId is included
                text: message,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Message sent:', data);
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { userId: userId ?? '', text: message, type: 'message', sentByClient: true },
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
                    <Pressable key={index} onPress={() => onSelectChat([friend])}>
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
                        <Text style={styles.navbarTitle}>Chat</Text>
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
                                            data.userId === userId ? styles.userMessage : styles.otherUserMessage
                                        ]}
                                    >
                                        {data.userId !== userId && showUsername && (
                                            <View style={styles.messageHeader}>
                                                <Text style={styles.username}>{data.username || 'Unknown'}</Text>
                                            </View>
                                        )}

                                        {data.userId === userId && showUsername && (
                                            <View style={styles.messageHeaderRight}>
                                                <Text style={styles.username}>{data.username || 'Me'}</Text>
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

// Styles for the app
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
        paddingBottom: 60, // Space for input area
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
        marginBottom: 8,
    },
    messageHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
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
