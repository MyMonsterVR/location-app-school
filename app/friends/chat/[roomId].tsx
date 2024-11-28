import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Image} from 'expo-image';
import {ActivityIndicator, Pressable, StyleSheet, TextInput, View} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {Text} from '@/components/ui/text';
import ProfilePicture from '@/components/ProfilePicture';
import GifModal from '@/components/GifModal';
import {useAuth, useUser} from '@clerk/clerk-expo';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {router, useLocalSearchParams} from "expo-router";
import {debounce} from "@/utils/utils";
import { useTheme } from '@react-navigation/native';
import {useFriends} from "@/hooks/useFriends";
import * as Location from 'expo-location';
import LocationMessage from "@/components/LocationMessage";

const SERVER_URL = `${process.env.EXPO_PUBLIC_SERVER_URL}`;

const Chat: React.FC = () =>
{
    const [messages, setMessages] = useState<definitions.Message[]>([]);
    const [participants, setParticipants] = useState<definitions.User[]>([]);
    const [message, setMessage] = useState<string>('');
    const [roomId, setRoomId] = useState<string>('');
    const [isGifModalVisible, setIsGifModalVisible] = useState<boolean>(false);
    const [readMessages, setReadMessages] = useState<Set<string[]>>(new Set());
    const [chatTitle, setChatTitle] = useState<string[]>([]);
    const [roomType, setRoomType] = useState<string>('single');
    const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
    const [hasScrolled, setHasScrolled] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchCount, setFetchCount] = useState(0); // New state to track completed fetches
    const totalFetchCount = 2;

    const ITEM_HEIGHT = 70;

    const {userId, getToken} = useAuth();
    const {user} = useUser();

    const theme = useTheme();
    const { friends } = useFriends(userId as string, getToken)

    const flashListRef = useRef<FlashList<any>>(null);
    const ws = useRef<WebSocket | null>(null);
    const existingMessageIds = useRef<Set<string>>(new Set());

    const local = useLocalSearchParams()

    // fetch participants username, ids and avatars
    const fetchParticipants = async () =>
    {
        const response = await fetch(`http://${SERVER_URL}/participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getToken()}`,
            },
            body: JSON.stringify({room: roomId}),
        });

        const data = await response.json();
        if (data)
        {
            setParticipants(data.users);  // Update participants list
            setFetchCount(prev => {
                const newCount = prev + 1;
                if (newCount === totalFetchCount) {
                    setIsLoading(false); // Set loading to false only when all fetches are done
                }
                return newCount;
            });
        }
    };

    const connectWebSocket = useCallback(() =>
    {
        if (!userId || !roomId || ws.current) return;  // Don't reinitialize WebSocket if already connected

        // Create a new WebSocket connection
        ws.current = new WebSocket(`http://${SERVER_URL}:8080/chat`);

        ws.current.onopen = () =>
        {
            setMessages([]);  // Clear messages when connecting to a new room
            setIsReconnecting(false);  // Reset reconnecting state
            setHasScrolled(false);  // Reset scroll state
            ws.current?.send(
                JSON.stringify({
                    type: 'join',
                    room: roomId,
                    userId,
                    displayName: user?.username,
                })
            );

            const firstMessageTimestamp = new Date(messages[0]?.createdAt).getTime();
            Promise.all([fetchParticipants(), fetchOlderMessages(roomId, firstMessageTimestamp, 20)]).then(() => {
                setFetchCount(2); // Update fetch count depending on what you've done
                setIsLoading(false); // Loading done
            });
        };

        ws.current.onmessage = (e) =>
        {
            const data = JSON.parse(e.data);

            if (data.type === 'history')
            {
                if (data.messages.length === 0) return;
                setMessages((prev) =>
                {
                    const newMessages = data.messages.filter(msg =>
                        !existingMessageIds.current.has(msg._id)
                    );
                    // Add new IDs to the Set
                    newMessages.forEach(msg => existingMessageIds.current.add(msg._id));
                    return [...prev, ...newMessages];
                });
            }

            if (data.type === 'message' && !data.sentByClient)
            {
                setMessages(prev =>
                {
                    if (existingMessageIds.current.has(data._id))
                    {
                        return prev; // Already exists, do not update
                    }
                    existingMessageIds.current.add(data._id);
                    return [...prev, {
                        ...data,
                        message: {
                            text: data.text,
                            messageType: data.messageType,
                            readBy: data.readBy || [],
                        },
                        user: {
                            userId: data.userId,
                            username: data.username,
                        },
                    }];
                });
            }

            if (data.type === 'read')
            {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === data.messageId
                            ? {
                                ...msg, message: {
                                    ...msg.message,
                                    readBy: [...msg.message.readby, data.userId]
                                }
                            }
                            : msg
                    )
                );
            }

            if (data.type === 'system')
            {
                // Handle a system message (new user joined)
                alert(data.message);  // Optionally show a message when a new user joins
            }
        };

        ws.current.onerror = (error) =>
        {
            console.error('WebSocket Error:', error);
            setIsReconnecting(true);  // Mark reconnect attempt
            reconnectWebSocket();  // Trigger reconnect
        };

        ws.current.onclose = () =>
        {
            setIsReconnecting(true);  // Mark reconnect attempt
            reconnectWebSocket();  // Trigger reconnect
        };

        return () =>
        {
            if (ws.current)
            {
                ws.current.close();  // Clean up WebSocket connection
                ws.current = null;     // Reset reference
            }
        };
    }, [roomId, userId, user]);

    const reconnectWebSocket = useCallback(() =>
    {
        const maxRetries = 10;  // Max retries before giving up
        let attempt = 0;
        const retryInterval = 1000;  // Retry interval (in ms)

        const attemptReconnect = () =>
        {
            if (ws.current && ws.current.readyState === WebSocket.CLOSED && attempt < maxRetries)
            {
                attempt++;
                connectWebSocket(); // Attempt to reconnect

                if (attempt >= maxRetries)
                {
                    console.error('Max WebSocket reconnect attempts reached');
                    setIsReconnecting(false); // Stop reconnect attempts after max retries
                    setIsLoading(false); // Reset loading state
                } else
                {
                    setTimeout(attemptReconnect, retryInterval * attempt); // Exponential backoff
                }
            } else if (!ws.current)
            {
                connectWebSocket(); // Make sure to re-initialize the connection if it's completely closed
            }
        };

        attemptReconnect(); // Start the reconnection attempts
    }, [connectWebSocket]);

    const sendMessage = async (text: string, messageType: 'text' | 'gif') =>
    {
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

        try
        {
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

            // Once the message is confirmed by the backend, update it with the real ID
            if (data._id)
            {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === sentMessage._id
                            ? {...msg, _id: data._id, sentByClient: false}  // Update temp ID to real ID
                            : msg
                    )
                );
            } else
            {
                console.error('Message ID not received from backend');
            }
        } catch (error)
        {
            console.error('Error sending message:', error);
        }
    };

    useEffect(() =>
    {
        const newRoomId = local.roomId
        setRoomId(newRoomId.toString());
        connectWebSocket();
    }, [connectWebSocket, local.roomId]);

    useEffect(() => {
        if (roomId) {
            connectWebSocket();  // Connect to WebSocket with the current room ID
        }

        return () => {
            if (ws.current) {
                ws.current.close();  // Clean up WebSocket connection
                ws.current = null;     // Reset reference
            }
        };
    }, [roomId]);  // Only recreate on roomId change

    useEffect(() =>
    {
        if (roomId)
        {
            connectWebSocket();  // Connect to WebSocket with the current room ID
        }

        return () =>
        {
            if (ws.current)
            {
                ws.current.close();  // Clean up WebSocket connection
                ws.current = null;
            }
        };
    }, [roomId, connectWebSocket]);


    // TODO: Change room db to to not be an array
    // TODO: Fix message loading
    useEffect(() =>
    {
        const getChatTitle = () =>
        {
            const participantUserIds = participants

            // Case 1: When there are exactly two participants in the chat (one current user and one other user)
            if (participantUserIds.length === 2)
            {
                const otherParticipant = Object.values(participants).find(
                    (participant) => participant.userId !== userId
                );

                if (otherParticipant)
                {
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
                if (participantNames.length === 1)
                {
                    return participantNames[0];
                }
                return `${participantNames.slice(0, 2).join(', ')} and ${participantNames.length - 2} others`;
            }

            return 'Unknown Chat';  // Default fallback if no participants found
        };

        setChatTitle(getChatTitle())
    }, [local.roomId, participants]);

    // Scroll to the bottom of the chat when new messages are added
    useEffect(() =>
    {
        if (messages.length > 0 && flashListRef.current && !hasScrolled)
        {
            flashListRef.current.scrollToIndex({index: messages.length - 1, animated: false});
        }
    }, [messages.length]);

    // on scrolling away from the bottom, set hasScrolled to true
    const onScrollBeginDrag = () =>
    {
        setHasScrolled(true);
    };

    const onScrollEndDrag = (event) =>
    {
        const {contentOffset, layoutMeasurement, contentSize} = event.nativeEvent;
        const paddingToBottom = 20;

        if (contentSize.height - layoutMeasurement.height - paddingToBottom <= contentOffset.y)
        {
            setHasScrolled(false);
        }
    };

    const GifMessage = React.memo(({gifUrl}) =>
    {
        return (
            <Image
                source={{uri: gifUrl.toString()}}
                style={styles.gifMessage}
                contentFit="contain"
                cachePolicy="memory-disk"
                priority="high"
                transition={300}
            />
        );
    });

    const fetchOlderMessages = async (roomId: string, lastMessageTimestamp: number, limit: number = 20) =>
    {
        try
        {
            const response = await fetch(`http://${SERVER_URL}/messages/${roomId}?before=${lastMessageTimestamp}&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await getToken()}`,
                },
            });

            setIsReconnecting(false);
            if (!response.ok)
            {
                throw new Error('Failed to fetch older messages');
            }

            const data = await response.json();
            return data.messages;
        } catch (error)
        {
            console.error('Error fetching older messages:', error);
            return [];
        }
    };

    const loadOlderMessages = useCallback(async () =>
    {
        if (messages.length > 0)
        {
            setIsReconnecting(true);
            const firstMessageTimestamp = new Date(messages[0]?.createdAt).getTime();
            const olderMessages = await fetchOlderMessages(roomId, firstMessageTimestamp, 20);

            if (olderMessages.length > 0)
            {
                // Only update if there are new messages
                setMessages((prevMessages) =>
                {
                    const newMessages = olderMessages.filter(msg => !prevMessages.some(p => p._id === msg._id));
                    return [...newMessages, ...prevMessages];
                });
            }
            setIsReconnecting(false); // Stop the reconnecting state
        }
    }, [messages, roomId]);

    const debouncedMarkAsRead = useRef(
        debounce(async (messageId: string) =>
        {
            const response = await fetch(`http://${SERVER_URL}/read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await getToken()}`,
                },
                body: JSON.stringify({
                    room: roomId,
                    messageId,
                    userId,
                }),
            });

            const data = await response.json();
            if (data.success)
            {
                // Update only the `readBy` field for the message without affecting other fields
                setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg._id === messageId
                            ? {
                                ...msg,
                                message: {
                                    ...msg.message,
                                    readBy: [...msg.message.readBy, userId],  // Add userId to readBy
                                },
                            }
                            : msg
                    )
                );
            }
        }, 1000)
    ).current;

    const onViewableItemsChanged = useRef(({viewableItems}: { viewableItems: any[] }) =>
    {
        const viewableMessageIds = viewableItems.map(item => item.item._id);

        // Only mark as read if they haven't been read yet
        const newReadMessages = viewableMessageIds.filter(
            (messageId) => !readMessages.has(messageId)
        );

        if (newReadMessages.length > 0)
        {
            // Mark messages as read in batches (debounced)
            newReadMessages.forEach((messageId) =>
            {
                debouncedMarkAsRead(messageId);
            });

            // Update `readMessages` without affecting the entire state
            setReadMessages((prev) => new Set([...prev, ...newReadMessages]));
        }
    });

    const viewabilityConfig = {
        waitForInteraction: true,
        viewAreaCoveragePercentThreshold: 50,
    };

    const renderItem = useCallback(({ item }) => {
        const user = item.user;
        if (!user) return null;

        const isOwnMessage = user.userId === userId;

        return (
            <View
                style={[
                    styles.messageContainer,
                    isOwnMessage ?
                        (item.message.messageType === 'text' ? styles.userMessage :
                            item.message.messageType === 'gif' ? styles.userGifMessage :
                                styles.userLocationMessage) :
                        (item.message.messageType === 'text' ? styles.otherUserMessage :
                            item.message.messageType === 'gif' ? styles.otherUserGifMessage :
                                styles.otherUserLocationMessage),
                ]}
            >
                {item.showUsername && (
                    <View style={isOwnMessage ? styles.messageHeaderRight : styles.messageHeader}>
                        <Text style={styles.username(theme, item.message.messageType !== 'gif')}>
                            {isOwnMessage ? 'Me' : user.username || 'Unknown'}
                        </Text>
                    </View>
                )}

                {item.message.messageType === 'text' ? (
                    <Text style={styles.messageText}>{item.message.text}</Text>
                ) : item.message.messageType === 'gif' ? (
                    <GifMessage gifUrl={item.message.text} />
                ) : item.message.messageType === 'location' ? (
                    <LocationMessage locationData={item.message.text} isOwnMessage={isOwnMessage} />
                ) : null}

                {isOwnMessage && item.isLastMessage && (
                    <View style={styles.readStatusContainer}>
                        {item.readBy?.slice(0, 2).map((readUserId, idx) => (
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
    }, [userId, theme]);

    const processMessages = useCallback((msgs) => {
        return msgs.map((message, index) => ({
            ...message,
            showUsername: index === 0 || msgs[index - 1].user.userId !== message.user.userId,
            isLastMessage: index === msgs.length - 1
        }));
    }, []);

    const memoizedMessages = useMemo(() => processMessages(messages), [messages, processMessages]);

    return (
        <SafeAreaView style={styles.container(theme)}>
            {isLoading ? (
                <View style={styles.loadingContainer(theme)}>
                    <ActivityIndicator size="large" color="#0078d4" style={styles.spinner} />
                    <Text style={styles.loadingText(theme)}>Loading your chat...</Text>
                </View>
            ) : (
                <>
                    <View style={styles.navbar(theme)}>
                        <Pressable onPress={() => router.push('/friends')}>
                            <Icon name="arrow-back" size={24} color={theme.colors.icon}/>
                        </Pressable>
                        <View style={styles.friendInfoContainer}>
                            {participants.length === 2 && participants.map((participant) => (
                                participant.userId !== userId && (
                                    <ProfilePicture key={participant.userId} userId={participant.userId}
                                                    styling={styles.profileAvatar}/>
                                )
                            ))}
                            {participants.length > 2 && (
                                <Icon name="people" size={24} color={theme.colors.icon}/>
                            )}
                            <Text style={styles.friendUsername(theme)}>{chatTitle}</Text>
                        </View>
                        <Pressable onPress={() => console.log("Settings")}>
                            <Icon name="settings" size={24} color={theme.colors.icon}/>
                        </Pressable>
                    </View>
                    <View style={styles.chatArea}>
                        <FlashList
                            ref={flashListRef}
                            data={memoizedMessages}
                            keyExtractor={(item) => item._id ? item._id.toString() : `item-${Math.random()}`} // Make sure to use a unique key like message ID
                            renderItem={renderItem}
                            contentContainerStyle={styles.messagesContainer}
                            onScrollBeginDrag={onScrollBeginDrag}
                            onScrollEndDrag={onScrollEndDrag}
                            estimatedItemSize={ITEM_HEIGHT}
                            onViewableItemsChanged={onViewableItemsChanged.current}
                            viewabilityConfig={viewabilityConfig}
                            onEndReachedThreshold={0.1}
                            onRefresh={loadOlderMessages}
                            refreshing={isReconnecting}/>
                    </View>

                {/* Message Input Area */}
                <View style={styles.inputContainer(theme)}>
                    <Pressable onPress={() => setIsGifModalVisible(true)} style={styles.gifButton}>
                        <Icon name="image" size={24} color={theme.colors.icon}/>
                    </Pressable>
                    <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Type a message..."
                        onSubmitEditing={() => sendMessage(message, 'text')}
                        style={styles.input}
                    />
                    <Pressable onPress={() => sendMessage(message, 'text')} style={styles.sendButton}>
                        <Icon name="send" size={24} color="#0078d4"/>
                    </Pressable>
                </View>

                {/* GIF Modal */}
                <GifModal
                    isVisible={isGifModalVisible}
                    onClose={() => setIsGifModalVisible(false)}
                    onSelectGif={sendMessage}/>
                </>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: (theme) => ({
        flex: 1,
        backgroundColor: theme.colors.background,
    }),
    navbar: (theme) => ({
        backgroundColor: theme.colors.background,
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
    }),
    loadingContainer: (theme) => ({
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    }),
    spinner: {
        marginBottom: 20,
    },
    loadingText: (theme) => ({
        fontSize: 18,
        color: '#555',
        fontWeight: 'bold',
        color: theme.colors.text,
    }),
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
    friendUsername: (theme) => ({
        fontSize: 18,
        color: theme.colors.text,
        fontWeight: 'bold',
        flexWrap: 'wrap',
    }),
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
    userLocationMessage: {
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
    username: (theme, hasBackground) => ({
        color: hasBackground ? '#fff' : theme.colors.text,
        fontSize: 14,
        fontWeight: 'bold',
    }),
    messageText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 20,
    },
    inputContainer: (theme) => ({
        borderTopWidth: 1,
        borderTopColor: '#444',
        padding: 10,
        backgroundColor: theme.colors.background,
        flexDirection: 'row',
        alignItems: 'center',
    }),
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