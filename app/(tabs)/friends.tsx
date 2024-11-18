import React, {useEffect, useState, useRef, useCallback} from 'react';
import { Image } from 'expo-image';
import {ScrollView, Pressable, TextInput, StyleSheet, View, Modal, FlatList} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Text } from '~/components/ui/text';
import { useAuth, useUser } from '@clerk/clerk-expo';
import ProfilePicture from "@/components/ProfilePicture";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SERVER_URL = `http://${process.env.EXPO_PUBLIC_SERVER_URL}`;

// Define types for message and user data
interface User {
    username: string;
    userId: string; // User ID should be a string (could be numeric or UUID)
}

interface Message {
    _id: string;
    userId: string;
    text: string;
    messageType: 'text' | 'gif';
    username?: string;
    readBy: string[];
    sentByClient?: boolean; // Flag to differentiate client messages
}

// Utility function to create a room ID dynamically
const createRoomId = (userIds: string[]): string => {
    const uniqueIds = Array.from(new Set(userIds));
    return `room-${uniqueIds.sort().join('-')}`;
};

const Friends: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState<string>('');
    const [gifSearch, setGifSearch] = useState<string>('');
    const [gifs, setGifs] = useState<any[]>([]);
    const [roomId, setRoomId] = useState<string>('');
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [isGifModalVisible, setIsGifModalVisible] = useState<boolean>(false);
    const [friends, setFriends] = useState<User[]>([
        { username: 'willer fake', userId: 'user_2oWHzUce33wlLHl4taHPaYpeIYn' },
        { username: 'raller fake', userId: 'user_2oWWxEKyYTXW1HD21yPggkAlYjx' },
    ]);
    const [readMessages, setReadMessages] = useState<string[]>([]);
    const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
    const [pos, setPos] = useState<string>('');  // Position for pagination (Tenor's `pos` parameter)
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);

    const { userId } = useAuth();
    const { user } = useUser();

    const scrollViewRef = useRef<ScrollView | null>(null);
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

    useEffect(() => {
        // Call the cache cleanup
        clearOldCache();
    }, []);

    // endregion

    const saveMessages = async () => {
        try {
            // Keep only the most recent MAX_CACHE_SIZE messages
            const messagesToCache = messages.slice(0, MAX_CACHE_SIZE);

            // Save the messages and the timestamp
            await AsyncStorage.setItem(`messages-${roomId}`, JSON.stringify({
                messages: messagesToCache,
                timestamp: Date.now(), // Save the current timestamp
            }));
        } catch (error) {
            console.error('Error caching messages:', error);
        }
    };

    useEffect(() => {
        if (!roomId) return;

        const loadMessages = async () => {
            try {
                const cachedMessages = await AsyncStorage.getItem(`messages-${roomId}`);
                if (cachedMessages) {
                    setMessages(JSON.parse(cachedMessages));
                } else {
                    // If no cached messages exist, you can fetch them from the server
                    // For example:
                    const response = await fetch(`${SERVER_URL}/messages/${roomId}`);
                    const data = await response.json();
                    setMessages(data.messages);  // Assuming the response contains an array of messages

                    // Optionally, you can cache these messages for future use
                    await AsyncStorage.setItem(`messages-${roomId}`, JSON.stringify(data.messages));
                }
            } catch (error) {
                console.error('Error loading cached messages:', error);
            }
        };

        loadMessages();  // Call the function to load messages for the current roomId
    }, [roomId]);  // Only trigger when roomId changes

    useEffect(() => {
        if (roomId && messages.length) saveMessages();
    }, [messages, roomId]);

    const connectWebSocket = useCallback(() => {
        if (!userId || !roomId || ws.current) return;  // Don't reinitialize WebSocket if already connected

        // Create a new WebSocket connection
        ws.current = new WebSocket(`${SERVER_URL}:8080/chat`);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
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
                setMessages((prev) => {
                    if (prev.some((msg) => msg._id === data._id)) return prev;
                    return [...prev, data];
                });
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
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        ws.current.onclose = () => {
            console.log('WebSocket closed. Attempting reconnect...');
            setIsReconnecting(true); // Mark reconnect attempt
            reconnectWebSocket(); // Trigger reconnect
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
            }
        };

        attemptReconnect(); // Start the reconnection attempts
    }, [connectWebSocket]);

    useEffect(() => {
        if (scrollViewRef.current) scrollViewRef.current.scrollToEnd({ animated: false });
    }, [messages]);

    useEffect(() => {
        if (roomId) {
            connectWebSocket(); // Connect/reconnect whenever the roomId changes (i.e., opening a new chat)
        }

        return () => {
            if (ws.current) {
                console.log("Cleaning up WebSocket connection...");
                ws.current.close(); // Clean up WebSocket connection when leaving the room
                ws.current = null; // Reset ws reference
            }
        };
    }, [roomId, connectWebSocket]);

    const sendMessage = async (text: string, messageType: 'text' | 'gif') => {
        if (!text.trim()) return;
        setMessage(''); // Clear the input immediately
        try {
            const response = await fetch(`${SERVER_URL}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room: roomId,
                    userId,
                    username: user?.username,
                    text,
                    messageType,
                }),
            });
            const data = await response.json();
            if (data._id) {
                setMessages((prev) => [
                    ...prev,
                    { _id: data._id, userId, username: user?.username, text, messageType, sentByClient: true },
                ]);
            } else {
                console.error('Message ID not received from backend');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const debounce = (func: Function, delay: number) => {
        let timer: NodeJS.Timeout;
        return (...args: any[]) => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => func(...args), delay);
        };
    };

    const debouncedSearchGifs = useRef(
        debounce(async (searchTerm: string, pos: string) => {
            if (!searchTerm.trim()) return;
            setLoading(true);

            try {
                const response = await fetch(
                    `https://tenor.googleapis.com/v2/search?q=${searchTerm}&key=${process.env.EXPO_PUBLIC_TENOR_KEY}&limit=20&pos=${pos}`
                );
                const data = await response.json();

                if (pos === '') {
                    // Reset GIFs on new search
                    setGifs(data.results);
                } else {
                    // Append GIFs if not on the first search
                    setGifs((prevGifs) => [...prevGifs, ...data.results]);
                }

                // Determine if there are more GIFs to load
                setHasMore(data.results.length === 20);  // If we received 20 GIFs, there's more to load
                setPos(data.next || '');  // Set the new `pos` value for the next request
            } catch (error) {
                console.error('Error fetching GIFs:', error);
            } finally {
                setLoading(false);
            }
        }, 500)
    ).current;

    useEffect(() => {
        if (gifSearch) {
            setPos('');  // Reset `pos` for the new search
            setHasMore(true);  // Ensure more GIFs can be loaded again
            debouncedSearchGifs(gifSearch, '');  // Start a fresh search
        }
    }, [gifSearch]);

    const loadMoreGifs = () => {
        if (loading || !hasMore || !pos) return;  // Avoid loading more if already fetching or no more results
        debouncedSearchGifs(gifSearch, pos);  // Use the `pos` to load the next set of GIFs
    };

    const closeGifModal = () => {
        setIsGifModalVisible(false);
        setGifs([]);
        setGifSearch('');
    };

    const insertGif = (gif: any) => {
        sendMessage(gif.media_formats.gif.url, 'gif');
        closeGifModal();
    };

    const getChatTitle = () => {
        const participantUserIds = roomId.split('-').slice(1); // Exclude the first 'room' part
        if (participantUserIds.length === 1) {
            const friend = friends.find((friend) => friend.userId === participantUserIds[0]);
            return friend ? friend.username : 'Unknown Friend';
        } else {
            const otherParticipants = friends.filter(
                (friend) => participantUserIds.includes(friend.userId) && friend.userId !== userId
            );
            const participantNames = otherParticipants.map((friend) => friend.username);
            if (participantNames.length === 1) return participantNames[0];
            return `${participantNames.slice(0, 2).join(', ')} and ${participantNames.length - 2} others`;
        }
    };

    const markAsRead = async (messageId: string) => {
        try {
            const response = await fetch(`${SERVER_URL}/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId,
                    userId,
                    roomId,
                }),
            });
            const responseText = await response.text();
            if (!response.ok) console.error('Failed to mark message as read:', responseText);
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    const debouncedMarkAsRead = useCallback(debounce(markAsRead, 1000), []);
    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
        const readMessagesInView = viewableItems.map((item) => item.item._id);
        readMessagesInView.forEach((messageId) => {
            if (!readMessages.includes(messageId)) {
                debouncedMarkAsRead(messageId);
                setReadMessages((prev) => [...prev, messageId]);
            }
        });
    });

    const viewabilityConfig = {
        waitForInteraction: true,
        viewAreaCoveragePercentThreshold: 50,
    };

    const onSelectChat = (selectedUsers: User[]) => {
        const userIds = selectedUsers.map((user) => user.userId);
        if (userId && !userIds.includes(userId)) {
            userIds.push(userId); // Make sure the current user is included
        }

        const newRoomId = createRoomId(userIds); // Create a unique room ID
        setRoomId(newRoomId); // Set the room ID to join the chat
        setModalVisible(true); // You can control showing modals or other UI elements here
    };


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.friendsList}>
                <Text style={styles.pageTitle}>Friends</Text>
                {friends.map((friend, index) => (
                    <Pressable key={index} onPress={() => onSelectChat([friend])} style={styles.friendItemContainer}>
                        <ProfilePicture userId={friend.userId} styling={styles.friendProfilePicture} />
                        <Text style={styles.friendUsername}>{friend.username}</Text>
                    </Pressable>
                ))}
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.navbar}>
                        <Pressable onPress={() => setModalVisible(false)}>
                            <Icon name="arrow-back" size={24} color="#fff" />
                        </Pressable>

                        <View style={styles.friendInfoContainer}>
                            <ProfilePicture userId={user?.userId ?? ''} style={styles.profileAvatar} />
                            <Text style={styles.friendUsername}>{getChatTitle()}</Text>
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
                                const showUsername = index === 0 || messages[index - 1].userId !== item.userId;
                                const isMessageRead = Array.isArray(item.readBy) && item.readBy.includes(userId);
                                const isLastMessageInRow = index === messages.length - 1 || messages[index + 1].userId !== item.userId;

                                // Only show "read by" status for your own messages
                                const isOwnMessage = item.userId === userId;
                                const readByUsers = Array.isArray(item.readBy) ? item.readBy.slice(0, 2) : [];

                                return (
                                    <View
                                        style={[
                                            styles.messageContainer,
                                            isOwnMessage ? styles.userMessage : styles.otherUserMessage,
                                        ]}
                                    >
                                        {item.userId !== userId && showUsername && (
                                            <View style={styles.messageHeader}>
                                                <Text style={styles.username}>{item.username || 'Unknown'}</Text>
                                            </View>
                                        )}
                                        {item.userId === userId && showUsername && (
                                            <View style={styles.messageHeaderRight}>
                                                <Text style={styles.username}>{'Me'}</Text>
                                            </View>
                                        )}

                                        {item.messageType === 'text' ? (
                                            <Text style={styles.messageText}>{item.text}</Text>
                                        ) : (
                                            <Image
                                                source={{ uri: item.text }}
                                                style={styles.gifMessage}
                                                cachePolicy="memory-disk"
                                            />
                                        )}

                                        {isOwnMessage && isLastMessageInRow && (
                                            <View style={styles.readStatusContainer}>
                                                {/* Display the first two users who have read the message */}
                                                {readByUsers.map((userId, idx) => (
                                                    <View
                                                        key={userId}
                                                        style={[
                                                            styles.readStatusProfilePicture,
                                                            { left: idx * 15 }, // Apply an offset to create the "peeking" effect
                                                        ]}
                                                    >
                                                        <ProfilePicture userId={userId} styling={styles.readStatusProfilePicture} />
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                );
                            }}
                            contentContainerStyle={styles.messagesContainer}
                            onViewableItemsChanged={onViewableItemsChanged.current}
                            viewabilityConfig={viewabilityConfig}
                        />
                    </View>

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
                </View>
            </Modal>

            {/* GIF Modal */}
            <Modal visible={isGifModalVisible} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.gifHeader}>
                        <TextInput
                            value={gifSearch}
                            onChangeText={setGifSearch}
                            placeholder="Search for GIFs"
                            style={styles.searchInput}
                        />
                        <Pressable onPress={() => closeGifModal()} style={styles.closeButton}>
                            <Icon name="close" size={24} color="#fff" />
                        </Pressable>
                    </View>

                    <FlatList
                        data={gifs}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => {
                            const gif = item.media_formats.gif;
                            const isTallGif = gif.width < gif.height;
                            return (
                                <Pressable
                                    onPress={() => insertGif(item)}
                                    style={[styles.gifThumbnailContainer, isTallGif && styles.tallGifThumbnail]}
                                >
                                    <Image
                                        source={{ uri: gif.url }}
                                        style={[styles.gifThumbnail, isTallGif && styles.tallGifThumbnailImage]}
                                        cachePolicy="memory-disk"
                                    />
                                </Pressable>
                            );
                        }}
                        numColumns={2}
                        contentContainerStyle={styles.gifsContainer}
                        onEndReached={loadMoreGifs}  // Trigger loading more GIFs when reaching the bottom
                        onEndReachedThreshold={0.5}  // Start loading more when 50% of the list is visible
                        ListFooterComponent={loading ? <Text>Loading more...</Text> : null}  // Footer to show loading status
                    />
                </View>
            </Modal>
        </SafeAreaView>
    );

};

// Styles for the app
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    friendsList: {
        padding: 20,
    },
    pageTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#fff',
    },
    friendItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#444',
        paddingVertical: 20,
    },
    friendProfilePicture: {
        width: 40,
        height: 40,
        borderRadius: 50, // Circle avatar
        marginRight: 10,
    },
    modalContainer: {
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
        elevation: 5, // Add subtle shadow for elevation effect (on Android)
        borderBottomWidth: 1,
        borderBottomColor: '#444',
        borderRadius: 10,  // Rounded corners for the navbar
    },
    friendInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center', // Align items horizontally (profile picture and name)
        flex: 1, // Allow it to take available space between left and right elements
        justifyContent: 'center', // Center the content
    },
    profileAvatar: {
        width: 35,
        height: 35,
        borderRadius: 50, // Circle avatar
        borderWidth: 2,
        borderColor: '#fff', // White border around avatar
        marginRight: 10, // Space between avatar and username
    },
    friendUsername: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
        flexWrap: 'wrap', // Allow name to wrap if needed
    },
    navbarGroupTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        flexWrap: 'wrap',
        textAlign: 'center',
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
    searchInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 5,
        fontSize: 16,
    },
    closeButton: {
        padding: 10,
    },
    gifButton: {
        padding: 8,
        marginLeft: 10,
        borderRadius: 50,
    },
    gifHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#333',
    },
    gifMessage: {
        width: 200, // Adjust the size based on your needs
        height: 200,
        borderRadius: 10,
    },
    gifsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
    },
    gifThumbnailContainer: {
        width: '48%',
        margin: '1%',
    },
    gifThumbnail: {
        width: '100%',
        height: 150,
        borderRadius: 10,
        contentFit: 'cover',
    },
    tallGifThumbnail: {
        width: '100%',
        height: 200,
    },
    tallGifThumbnailImage: {
        height: '100%',
        contentFit: 'cover',
    },
    categoriesContainer: {
        padding: 10,
    },
    categoryText: {
        color: '#fff',
        padding: 10,
        fontSize: 18,
    },
    readStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    readStatusProfilePicture: {
        width: 20,
        height: 20,
        borderRadius: 50, // Circle avatar
        marginRight: 5,
        borderWidth: 2,
        borderColor: '#fff', // White border around avatar
        position: 'relative', // Ensures stacking works
    },
});


export default Friends;
