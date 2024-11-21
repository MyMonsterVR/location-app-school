import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Image} from 'expo-image';
import {FlatList, Pressable, StyleSheet, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {Text} from '@/components/ui/text';
import ProfilePicture from '@/components/ProfilePicture';
import GifModal from '@/components/GifModal';
import {useAuth, useUser} from '@clerk/clerk-expo';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {router, useLocalSearchParams} from "expo-router";

const SERVER_URL = `${process.env.EXPO_PUBLIC_SERVER_URL}`;

interface User {
    username: string;
    userId: string;
}

interface Message {
    __v: number;
    _id: string;
    createdAt: string;
    updatedAt: string;
    message: {
        text: string;
        messageType: 'text' | 'gif';
    };
    room: {
        roomId: string;
    };
    user: {
        userId: string;
        username: string;
    }[];
}

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [participants, setParticipants] = useState<User[]>([]);
    const [message, setMessage] = useState<string>('');
    const [roomId, setRoomId] = useState<string>('');
    const [isGifModalVisible, setIsGifModalVisible] = useState<boolean>(false);
    const [readMessages, setReadMessages] = useState<string[]>([]);
    const [chatTitle, setChatTitle] = useState<string[]>([]);
    const [roomType, setRoomType] = useState<string>('single');
    const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
    const { userId, getToken } = useAuth();
    const { user } = useUser();
    const flatListRef = useRef(null);
    const ws = useRef<WebSocket | null>(null);

    // region TODO: MOVE TO WHEN APP STARTS
    const MAX_CACHE_SIZE = 100; // Maximum number of messages to cache
    const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    const clearOldCache = async () => {
        try {
            // Get all the keys in AsyncStorage
            const keys = await AsyncStorage.getAllKeys();

            // Filter keys that are related to chat messages
            const messageKeys = keys.filter(key => key.startsWith('messages-'));

            // Define a threshold for cache expiration (e.g., 24 hours)
            const cacheExpirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            const currentTime = new Date().getTime();

            // Iterate over each message cache key and check its timestamp
            for (const key of messageKeys) {
                const cachedData = await AsyncStorage.getItem(key);
                const data = JSON.parse(cachedData);

                if (data && data.timestamp) {
                    const cacheAge = currentTime - new Date(data.timestamp).getTime();

                    // If cache is older than the expiration time, clear it
                    if (cacheAge > cacheExpirationTime) {
                        console.log(`Cache for ${key} is older than 24 hours, clearing it.`);
                        await AsyncStorage.removeItem(key);  // Clear the cache
                    }
                }
            }
        } catch (error) {
            console.error('Error clearing old cache:', error);
        }
    };
    // endregion

    const local = useLocalSearchParams()

    useEffect(() => {
        const newRoomId = local.roomId
        setRoomId(newRoomId.toString());
        connectWebSocket();
    }, [connectWebSocket, local.roomId]);

    const connectWebSocket = useCallback(() => {
        if (!userId || !roomId || ws.current) return;  // Don't reinitialize WebSocket if already connected

        // Create a new WebSocket connection
        ws.current = new WebSocket(`http://${SERVER_URL}:8080/chat`);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
            setMessages([]);  // Clear messages when connecting to a new room
            ws.current?.send(
                JSON.stringify({
                    type: 'join',
                    room: roomId,
                    userId,
                    displayName: user?.username,
                })
            );
        };

        ws.current.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.type === 'history') {
                setMessages((prev) => (prev.length !== data.messages.length ? data.messages : prev));
            }

            if (data.type === 'message' && !data.sentByClient) {
                console.log('Received message:', data);

                setMessages((prev) => {
                    if (prev.some((msg) => msg._id === data._id)) return prev;

                    // Flatten the message data for rendering consistency
                    return [...prev, {
                        ...data,
                        message: {
                            text: data.text,  // Assuming you want a message object with a 'text' key
                            messageType: data.messageType,
                            readBy: data.readBy || [],
                        },
                        user: {
                            userId: data.userId,
                            username: data.username,
                        },
                    }];
                });

                console.log('messages:', messages);
            }

            if (data.type === 'read') {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === data.messageId
                            ? { ...msg, readBy: [...msg.readBy, data.userId] }
                            : msg
                    )
                );
            }

            if (data.type === 'system') {
                // Handle a system message (new user joined)
                alert(data.message);  // Optionally show a message when a new user joins
            }
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        ws.current.onclose = () => {
            console.log('WebSocket closed. Attempting reconnect...');
            setIsReconnecting(true);  // Mark reconnect attempt
            reconnectWebSocket();  // Trigger reconnect
        };
    }, [roomId, userId, user]);

    const reconnectWebSocket = useCallback(() => {
        const maxRetries = 10;  // Max retries before giving up
        let attempt = 0;
        const retryInterval = 1000;  // Retry interval (in ms)

        const attemptReconnect = () => {
            if (ws.current && ws.current.readyState === WebSocket.CLOSED && attempt < maxRetries) {
                attempt++;
                console.log(`Reconnecting WebSocket, attempt ${attempt}`);
                connectWebSocket(); // Attempt to reconnect

                if (attempt >= maxRetries) {
                    console.error('Max WebSocket reconnect attempts reached');
                    setIsReconnecting(false); // Stop reconnect attempts after max retries
                } else {
                    setTimeout(attemptReconnect, retryInterval * attempt); // Exponential backoff
                }
            } else if (!ws.current) {
                console.log('WebSocket was closed or not initialized, attempting to reconnect...');
                connectWebSocket(); // Make sure to re-initialize the connection if it's completely closed
            }
        };

        attemptReconnect(); // Start the reconnection attempts
    }, [connectWebSocket]);

    const sendMessage = async (text: string, messageType: 'text' | 'gif') => {
        if (!text.trim()) return;
        setMessage('');  // Clear the input

        // Add the message immediately to the chat (for instant UI update)
        const sentMessage = {
            message: {
                text: text,  // Assuming you want a message object with a 'text' key
                messageType: messageType,
                readBy: [],
            },
            user: {
                userId: userId,
                username: user.username,
            },
        };

        setMessages((prev) => [...prev, sentMessage]);

        try {
            const response = await fetch(`http://${SERVER_URL}/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await getToken()}`,
                },
                body: JSON.stringify({
                    room: roomId,
                    userId,
                    username: user?.username,
                    text,
                    messageType,
                    roomType,
                    participants,
                }),
            });

            const data = await response.json();
            console.log('Message sent:', data);

            // Once the message is confirmed by the backend, update it with the real ID
            if (data._id) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === sentMessage._id
                            ? { ...msg, _id: data._id, sentByClient: false }  // Update temp ID to real ID
                            : msg
                    )
                );
            } else {
                console.error('Message ID not received from backend');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    useEffect(() => {
        if (roomId) {
            connectWebSocket();  // Connect to WebSocket with the current room ID
        }

        return () => {
            if (ws.current) {
                ws.current.close();  // Clean up WebSocket connection
                ws.current = null;
            }
        };
    }, [roomId, connectWebSocket]);

    // fetch participants username, ids and avatars
    const fetchParticipants = async () => {
        const response = await fetch(`http://${SERVER_URL}/participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getToken()}`,
            },
            body: JSON.stringify({ room: roomId }),
        });

        const data = await response.json();
        if (data) {
            setParticipants(data.users);  // Update participants list
        }
    };

    // Fetch participants when roomId changes
    useEffect(() => {
        if (roomId) {
            fetchParticipants();
        }
    }, [roomId]);

    // TODO: Change room db to to not be an array
    // TODO: Fix message loading
    useEffect(() => {
        const getChatTitle = () => {
            const participantUserIds = participants

            // Case 1: When there are exactly two participants in the chat (one current user and one other user)
            if (participantUserIds.length === 2)
            {
                const otherParticipant = Object.values(participants).find(
                    (participant) => participant.userId !== userId
                );

                if(otherParticipant) {
                    return otherParticipant.username || 'Unknown Participant';
                }
            }
            // Case 2: When there are more than two participants in the chat
            else if (participantUserIds.length > 2)
            {
                // Filter participants who are in the current room and not the current user
                const otherParticipants = Object.values(participants).filter(
                    (participant) =>
                        participantUserIds.includes(participant.userId) && participant.userId !== userId
                );

                const participantNames = otherParticipants.map(
                    (participant) => participant.username
                );

                // Return participant names or fallback to "others"
                if (participantNames.length === 1) {
                    return participantNames[0];
                }
                return `${participantNames.slice(0, 2).join(', ')} and ${participantNames.length - 2} others`;
            }

            return 'Unknown Chat';  // Default fallback if no participants found
        };

        setChatTitle(getChatTitle())
    }, [local.roomId, participants]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.navbar}>
                <Pressable onPress={() => router.push('/friends')}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </Pressable>
                <View style={styles.friendInfoContainer}>
                    <ProfilePicture userId={userId} styling={styles.profileAvatar} />
                    <Text style={styles.friendUsername}>{chatTitle}</Text>
                </View>
                <Pressable onPress={() => console.log("Settings")}>
                    <Icon name="settings" size={24} color="#fff" />
                </Pressable>
            </View>

            <View style={styles.chatArea}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => {
                        const user = item.user; // Directly access the 'user' object
                        if (!user) return null; // If 'user' is undefined, don't render the message

                        const showUsername = index === 0 || (messages[index - 1]?.user?.userId !== user.userId);
                        const isMessageRead = Array.isArray(item.readBy) && item.readBy.includes(userId);
                        const isLastMessageInRow = index === messages.length - 1 || messages[index + 1]?.user?.userId !== user.userId;
                        const isOwnMessage = user.userId === userId;
                        const readByUsers = Array.isArray(item.readBy) ? item.readBy.slice(0, 2) : [];

                        return (
                            <View
                                style={[
                                    styles.messageContainer,
                                    isOwnMessage
                                        ? item.message.messageType === 'text'
                                            ? styles.userMessage
                                            : styles.userGifMessage
                                        : item.message.messageType === 'text'
                                            ? styles.otherUserMessage
                                            : styles.otherUserGifMessage,
                                ]}
                            >
                                {/* Display Username */}
                                {user.userId !== userId && showUsername && (
                                    <View style={styles.messageHeader}>
                                        <Text style={styles.username}>{user.username || 'Unknown'}</Text>
                                    </View>
                                )}

                                {user.userId === userId && showUsername && (
                                    <View style={styles.messageHeaderRight}>
                                        <Text style={styles.username}>{'Me'}</Text>
                                    </View>
                                )}

                                {/* Message Type: Text or GIF */}
                                {item.message.messageType === 'text' ? (
                                    <Text style={styles.messageText}>{item.message.text}</Text>
                                ) : (
                                    <Image
                                        source={{ uri: item.message.text }}
                                        style={styles.gifMessage}
                                        cachePolicy="memory-disk"
                                    />
                                )}

                                {/* Read Status */}
                                {isOwnMessage && isLastMessageInRow && (
                                    <View style={styles.readStatusContainer}>
                                        {readByUsers.map((readUserId, idx) => (
                                            <View
                                                key={readUserId}
                                                style={[
                                                    styles.readStatusProfilePicture,
                                                    { left: idx * 15 },
                                                ]}
                                            >
                                                <ProfilePicture userId={readUserId} styling={styles.readStatusProfilePicture} />
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    }}
                    contentContainerStyle={styles.messagesContainer}
                />
            </View>

            {/* Message Input Area */}
            <View style={styles.inputContainer}>
                <Pressable onPress={() => setIsGifModalVisible(true)} style={styles.gifButton}>
                    <Icon name="image" size={24} color="#fff" />
                </Pressable>
                <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Type a message..."
                    onSubmitEditing={() => sendMessage(message, 'text')}
                    style={styles.input}
                />
                <Pressable onPress={() => sendMessage(message, 'text')} style={styles.sendButton}>
                    <Icon name="send" size={24} color="#0078d4" />
                </Pressable>
            </View>

            {/* GIF Modal */}
            <GifModal isVisible={isGifModalVisible} onClose={() => setIsGifModalVisible(false)} onSelectGif={sendMessage} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#222',
    },
    navbar: {
        backgroundColor: '#333',
        paddingTop: 10,
        paddingBottom: 10,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
        borderRadius: 10,
    },
    friendInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    profileAvatar: {
        width: 35,
        height: 35,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#fff',
        marginRight: 10,
    },
    friendUsername: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
        flexWrap: 'wrap',
    },
    chatArea: {
        flex: 1,
        padding: 10,
    },
    messagesContainer: {
        paddingBottom: 60,
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
    userGifMessage: {
        padding: 0,
        alignSelf: 'flex-end',
    },
    otherUserMessage: {
        backgroundColor: '#333',
        alignSelf: 'flex-start',
    },
    otherUserGifMessage: {
        padding: 0,
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
    gifButton: {
        padding: 8,
        marginLeft: 10,
        borderRadius: 50,
    },
    gifMessage: {
        width: 200,
        height: 200,
        borderRadius: 10,
    },
    readStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    readStatusProfilePicture: {
        width: 20,
        height: 20,
        borderRadius: 50,
        marginRight: 5,
        borderWidth: 2,
        borderColor: '#fff',
        position: 'relative',
    },
});

export default Chat;