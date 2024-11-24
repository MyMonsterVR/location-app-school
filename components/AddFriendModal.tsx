import React, { useState } from 'react';
import { Modal, View, TextInput, Button, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { useAuth } from '@clerk/clerk-expo';

interface AddFriendModalProps {
    isVisible: boolean;
    onClose: () => void;
    onAddFriend: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ isVisible, onClose, onAddFriend }) => {
    const [friendUsername, setFriendUsername] = useState('');
    const { getToken } = useAuth();

    const handleAddFriend = async () => {
        if (!friendUsername.trim()) {
            alert('Please enter a username to search.');
            return;
        }

        try {
            const token = await getToken();
            const response = await fetch(
                `http://${process.env.EXPO_PUBLIC_SERVER_URL}/users/search`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ username: friendUsername }),
                },
            );

            if (response.ok) {
                const data = await response.json();
                if (data.userId) {
                    await addFriend(data.userId);
                    onAddFriend();
                    onClose();
                } else {
                    alert('User not found');
                }
            } else {
                throw new Error('Failed to search for friend');
            }
        } catch (error) {
            console.error('Error searching for friend:', error);
            alert('Error searching for user');
        }
    };

    const addFriend = async (friendUserId: string) => {
        try {
            const token = await getToken();
            const response = await fetch(
                `http://${process.env.EXPO_PUBLIC_SERVER_URL}/friends/add`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ friendUserId }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to add friend');
            }

            console.log('Friend added successfully');
        } catch (error) {
            console.error('Error adding friend:', error);
            alert('Error adding friend. Please try again later.');
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Add Friend</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter friend's username"
                        value={friendUsername}
                        onChangeText={setFriendUsername}
                    />
                    <View style={styles.modalButtons}>
                        <Button title="Cancel" onPress={onClose} />
                        <Button title="Send" onPress={handleAddFriend} />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#222',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
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
        borderRadius: 50,
        marginRight: 10,
    },
    friendUsername: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
        flexWrap: 'wrap',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#333',
        padding: 20,
        width: '80%',
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#fff',
    },
    input: {
        height: 40,
        borderColor: '#444',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        paddingHorizontal: 10,
        color: '#fff',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});

export default AddFriendModal;