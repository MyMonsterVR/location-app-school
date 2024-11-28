import React, { useState, useCallback } from 'react';
import {
    View,
    Modal,
    FlatList,
    TouchableOpacity,
    Text,
    StyleSheet,
    useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFriends } from "@/hooks/useFriends";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useTheme } from "@react-navigation/native";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

const ShareDestination = ({ selectedDestination }) => {
    const { userId, getToken } = useAuth();
    const { user } = useUser();
    const { friends } = useFriends(userId, getToken);
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedFriends, setSelectedFriends] = useState(new Set());
    const theme = useTheme();
    const colorScheme = useColorScheme();

    const toggleModal = useCallback(() => {
        setModalVisible(prev => !prev);
    }, []);

    const selectFriend = useCallback((friendId) => {
        setSelectedFriends(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(friendId)) {
                newSelected.delete(friendId);
            } else {
                newSelected.add(friendId);
            }
            return newSelected;
        });
    }, []);

    const cancelShare = () => {
        setSelectedFriends(new Set());
        toggleModal();
    }

    const shareRoute = useCallback(async () => {
        const selectedFriendsArray = Array.from(selectedFriends);

        for (const friendId of selectedFriendsArray) {
            const friend = friends.find((f) => f.userId === friendId);
            if (friend) {
                try {
                    const response = await fetch(`http://${SERVER_URL}/send`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${await getToken()}`,
                        },
                        body: JSON.stringify({
                            room: friend.roomId,
                            userId,
                            username: user?.username,
                            text: JSON.stringify({
                                latitude: selectedDestination.latitude,
                                longitude: selectedDestination.longitude
                            }),
                            messageType: 'location',
                            roomType: 'single',
                            participants: [userId, friendId],
                        }),
                    });
                    if (!response.ok) {
                        throw new Error('Failed to share route');
                    }
                } catch (error) {
                    console.error('Error sharing route:', error);
                    // Handle error (e.g., show an error message to the user)
                }
            }
        }

        setSelectedFriends(new Set());
        toggleModal();
    }, [selectedFriends, friends, userId, getToken, user, selectedDestination, toggleModal]);

    const styles = getStyles(theme, colorScheme);

    return (
        <>
            <TouchableOpacity style={styles.shareButtonIcon} onPress={toggleModal}>
                <Icon name="share-social-outline" size={30} color="#fff" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={toggleModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Share with Friends</Text>
                        <FlatList
                            data={friends || []}
                            keyExtractor={(item) => item.userId}
                            renderItem={({ item }) => {
                                const isSelected = selectedFriends.has(item.userId);
                                return (
                                    <TouchableOpacity
                                        style={[styles.friendItem, isSelected && styles.selectedFriendItem]}
                                        onPress={() => selectFriend(item.userId)}
                                    >
                                        <Text style={styles.friendUsername}>{item.username}</Text>
                                        {isSelected && <Icon name="checkmark-circle" size={24} color={theme.colors.primary} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                        <TouchableOpacity style={styles.shareButton} onPress={shareRoute}>
                            <Text style={styles.shareButtonText}>Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={cancelShare}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const getStyles = (theme, colorScheme) => StyleSheet.create({
    shareButtonIcon: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        backgroundColor: theme.colors.button,
        padding: 15,
        borderRadius: 50,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        backgroundColor: colorScheme === 'dark' ? theme.colors.card : theme.colors.background,
        borderRadius: 15,
        marginHorizontal: 30,
        paddingBottom: 20,
        elevation: 5,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 15,
        textAlign: 'center',
        paddingTop: 20,
    },
    friendItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    selectedFriendItem: {
        backgroundColor: theme.colors.background + '10',
    },
    friendUsername: {
        fontSize: 16,
        color: theme.colors.text,
    },
    shareButton: {
        backgroundColor: theme.colors.button,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
        marginHorizontal: 20,
    },
    shareButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        marginTop: 10,
        backgroundColor: theme.colors.notification,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 20,
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ShareDestination;