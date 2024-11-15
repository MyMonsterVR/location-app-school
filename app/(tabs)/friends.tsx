import React, { useEffect, useState, useRef } from 'react';
import { Image } from 'expo-image';
import {ScrollView, Pressable, TextInput, StyleSheet, View, Modal, FlatList} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Text } from '~/components/ui/text';
import { useAuth, useUser } from '@clerk/clerk-expo';
import ProfilePicture from "@/components/ProfilePicture";

const SERVER_URL = `http://${process.env.EXPO_PUBLIC_SERVER_URL}`;

// Define types for message and user data
interface User {
    username: string;
    userId: string; // User ID should be a string (could be numeric or UUID)
}

interface Message {
    userId: string;
    text: string;
    messageType: 'text' | 'gif';
    username?: string;
    sentByClient?: boolean; // Flag to differentiate client messages
}

// Utility function to create a room ID dynamically
const createRoomId = (userIds: string[]): string => {
    const sortedUserIds = userIds.sort();
    return `room-${sortedUserIds.join('-')}`;
};

const Friends: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState<string>(''); // message text state
    const [friends, setFriends] = useState<User[]>([
        { username: 'willer fake', userId: 'user_2oWHzUce33wlLHl4taHPaYpeIYn' },
        { username: 'raller fake', userId: 'user_2oWWxEKyYTXW1HD21yPggkAlYjx' },
    ]);
    const [gifSearch, setGifSearch] = useState<string>('');
    const [categories, setCategories] = useState<any[]>([]);
    const [isGifModalVisible, setIsGifModalVisible] = useState<boolean>(false);
    const [gifs, setGifs] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [roomId, setRoomId] = useState<string>('');
    const { userId } = useAuth();
    const { user } = useUser();

    let ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!userId || !roomId) return;

        if (!ws.current) {
            ws.current = new WebSocket(`${SERVER_URL}:8080/chat`);
        }

        const socket = ws.current;

        socket.onopen = () => {
            console.log('Connected to WebSocket server');
            socket.send(JSON.stringify({ type: 'join', room: roomId, userId, displayName: user?.username }));
        };

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'history') {
                setMessages(data.messages);
            } else if (data.type === 'message' && data.sentByClient !== true) {
                setMessages((prevMessages) => [...prevMessages, data]);
            }
        };

        return () => {
            socket.close();
        };
    }, [userId, roomId, user]);


    const scrollViewRef = useRef<ScrollView | null>(null);

    useEffect(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: false });
        }
    }, [messages]); // This will scroll to the bottom whenever messages change

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(
                    'https://tenor.googleapis.com/v2/categories?key=' +
                    process.env.EXPO_PUBLIC_TENOR_KEY +
                    '&client_key=my_test_app'
                );
                const data = await response.json();
                setCategories(data.tags);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        if (isGifModalVisible) {
            fetchCategories();
        }
    }, [isGifModalVisible]);

    // Handle the room selection (either one-on-one or group chat)
    const onSelectChat = (selectedUsers: User[]) => {
        const userIds = selectedUsers.map((user) => user.userId);
        if (userId && !userIds.includes(userId)) {
            userIds.push(userId); // Ensure the current user is included in the room
        }

        const newRoomId = createRoomId(userIds);
        setRoomId(newRoomId);
        setModalVisible(true);
    };

    // Send a message to the backend and update state
    const sendMessage = (text: string, messageType: 'text' | 'gif') => {
        if (!text.trim()) return;

        // Clear the input immediately
        setMessage('');

        // Send message via HTTP request
        fetch(`${SERVER_URL}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                room: roomId,
                userId: userId ?? '', // Ensure userId is included
                username: user?.username,
                text,
                messageType,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { userId: userId ?? '', text, messageType, sentByClient: true },
                ]);
            })
            .catch((error) => {
                console.error('Error sending message:', error);
            });
    };

    function debounce(func: Function, delay: number) {
        let timer: NodeJS.Timeout;

        return (...args: any[]) => {
            if (timer) {
                clearTimeout(timer); // Cancel the previous timer if the user keeps typing
            }

            timer = setTimeout(() => {
                func(...args); // Call the function after the delay
            }, delay);
        };
    }

    const debouncedSearchGifs = useRef(
        debounce(async (searchTerm: string) => {
            if (!searchTerm.trim()) return;

            const searchUrl = `https://tenor.googleapis.com/v2/search?q=${searchTerm}&key=${process.env.EXPO_PUBLIC_TENOR_KEY}&client_key=my_test_app&limit=10`;

            try {
                const response = await fetch(searchUrl);
                const data = await response.json();
                setGifs(data.results); // Update the state with the GIF results
            } catch (error) {
                console.error('Error fetching GIFs:', error);
            }
        }, 500) // 500ms debounce
    ).current;

    useEffect(() => {
        debouncedSearchGifs(gifSearch);
    }, [gifSearch]);

    const fetchGifsByCategory = (category: string) => {
        const searchUrl = `https://tenor.googleapis.com/v2/search?q=${category}&key=${process.env.EXPO_PUBLIC_TENOR_KEY}&client_key=my_test_app&limit=10`;

        fetch(searchUrl)
            .then((response) => response.json())
            .then((data) => {
                setGifs(data.results); // Update the state with the GIF results
            })
            .catch((error) => {
                console.error('Error fetching GIFs:', error);
            });
    };

    const closeGifModal = () => {
        setIsGifModalVisible(false);
        setGifs([]);
        setGifSearch('');
    };

    const insertGif = (gif: any) => {
        const gifUrl = gif.media_formats.gif.url;

        // Immediately send the GIF URL to the server, without modifying the message state
        sendMessage(gifUrl, 'gif');
        closeGifModal()
    };

    // Helper function to get the chat title (friend's name or group name)
    const getChatTitle = () => {
        // Split the room ID into its user IDs
        const participantUserIds = roomId.split('-').slice(1);  // Exclude the first 'room' part

        // Check if it's a one-on-one or group chat
        if (participantUserIds.length === 1) {
            // One-on-one chat: Find the friend's username (exclude user's own ID)
            const friend = friends.find(friend => friend.userId === participantUserIds[0]);
            return friend ? friend.username : 'Unknown Friend';
        } else {
            // Group chat: Exclude the user's own ID and show the other participants' names
            const otherParticipants = friends.filter(friend =>
                participantUserIds.includes(friend.userId) && friend.userId !== userId
            );

            // If there are other participants, show their names (e.g., "Alice, Bob, and 3 others")
            const participantNames = otherParticipants.map(friend => friend.username);

            if (participantNames.length === 1) {
                return participantNames[0]; // Only one other participant
            } else if (participantNames.length > 1) {
                return `${participantNames.slice(0, 2).join(', ')} and ${participantNames.length - 2} others`; // Show the first two names and the count of others
            } else {
                return 'Group Chat'; // Default if no participants found
            }
        }
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

            {/* Modal with Navbar and Chat Area */}
            <Modal visible={modalVisible} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.navbar}>
                        {/* Back Button */}
                        <Pressable onPress={() => setModalVisible(false)}>
                            <Icon name="arrow-back" size={24} color="#fff" />
                        </Pressable>

                        {/* Profile Picture and Username */}
                        <View style={styles.friendInfoContainer}>
                            {/* Profile Picture */}
                            <ProfilePicture userId={user?.userId ?? ''} style={styles.profileAvatar} />

                            {/* Friend's Name */}
                            <Text style={styles.friendUsername}>{getChatTitle()}</Text>
                        </View>

                        {/* Optional Settings Button */}
                        <Pressable onPress={() => console.log("Settings")}>
                            <Icon name="settings" size={24} color="#fff" />
                        </Pressable>
                    </View>

                    {/* Chat Area */}
                    <View style={styles.chatArea}>
                        <FlatList
                            data={messages}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item, index }) => {
                                const showUsername = index === 0 || messages[index - 1].userId !== item.userId;
                                return (
                                    <View style={[styles.messageContainer, item.userId === userId ? styles.userMessage : styles.otherUserMessage]}>
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
                                            <Image source={{ uri: item.text }} style={styles.gifMessage} />
                                        )}
                                    </View>
                                );
                            }}
                            contentContainerStyle={styles.messagesContainer}
                            onContentSizeChange={() => {
                                if (scrollViewRef.current) {
                                    scrollViewRef.current.scrollToEnd({ animated: true });
                                }
                            }}
                        />
                    </View>

                    {/* Message Input */}
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

                    {/* Categories */}
                    {!gifSearch && (
                        <ScrollView horizontal style={styles.categoriesContainer}>
                            {categories.map((category) => (
                                <Pressable key={category.searchterm} onPress={() => fetchGifsByCategory(category.searchterm)}>
                                    <Text style={styles.categoryText}>{category.name}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    )}

                    {/* GIF Thumbnails */}
                    <ScrollView contentContainerStyle={styles.gifsContainer}>
                        {gifs.map((gif, index) => {
                            const isTallGif = gif.media_formats.gif.width < gif.media_formats.gif.height;
                            return (
                                <Pressable
                                    key={index}
                                    onPress={() => insertGif(gif)}
                                    style={[
                                        styles.gifThumbnailContainer,
                                        isTallGif && styles.tallGifThumbnail,
                                    ]}
                                >
                                    <Image
                                        source={{ uri: gif.media_formats.gif.url }}
                                        style={[
                                            styles.gifThumbnail,
                                            isTallGif && styles.tallGifThumbnailImage,
                                        ]}
                                    />
                                </Pressable>
                            );
                        })}
                    </ScrollView>
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
    friendUsername: {
        fontSize: 18,
        color: '#fff',
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
    sendButton: {
        marginLeft: 10,
        padding: 12,
        borderRadius: 50,
        backgroundColor: '#0078d4', // Blue background for send button
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Apply flex wrap for group title
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
        resizeMode: 'cover',
    },
    tallGifThumbnail: {
        width: '100%',
        height: 200,
    },
    tallGifThumbnailImage: {
        height: '100%',
        resizeMode: 'cover',
    },
    categoriesContainer: {
        padding: 10,
    },
    categoryText: {
        color: '#fff',
        padding: 10,
        fontSize: 18,
    },
});

export default Friends;
