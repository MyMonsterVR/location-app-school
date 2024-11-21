import React, { useEffect, useState } from 'react';
import { ScrollView, Pressable, StyleSheet, Button, Modal, View, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import ProfilePicture from '@/components/ProfilePicture';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

interface User {
    username: string;
    userId: string;
}

const Friends: React.FC = () => {
    const [friends, setFriends] = useState<User[]>([]);
    const { userId, getToken  } = useAuth();  // User ID from Clerk Auth
    const [friendUsername, setFriendUsername] = useState(''); // Username for searching friends
    const [isModalVisible, setModalVisible] = useState(false); // Modal visibility state

    // Function to fetch friends from the server using fetch()
    const fetchFriends = async () => {
        try {
            const response = await fetch(`http://${process.env.EXPO_PUBLIC_SERVER_URL}/friends`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await getToken()}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                console.log(data)
                setFriends(data.friends || []);
            } else {
                console.error('Failed to fetch friends:', response.statusText);
                alert('Error fetching friends. Please try again later.');
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
            alert('Error fetching friends. Please try again later.');
        }
    };

    // Fetch friends on component mount
    useEffect(() => {
        fetchFriends();
    }, []);  // Empty array ensures this runs once after initial render

    // Function to add a friend by their userId using fetch()
    const addFriend = async (friendUserId: string) => {
        try {
            const response = await fetch(
                `http://${process.env.EXPO_PUBLIC_SERVER_URL}/friends/add`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await getToken()}`,
                    },
                    body: JSON.stringify({ userId, friendUserId }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log('Friend added successfully:', data);
                fetchFriends(); // Refresh the friend list after adding
            } else {
                console.error('Failed to add friend:', response.statusText);
                alert('Error adding friend. Please try again later.');
            }
        } catch (error) {
            console.error('Error adding friend:', error);
            alert('Error adding friend. Please try again later.');
        }
    };

    // Handle search for a friend by username using fetch()
    const handleAddFriend = async () => {
        if (!friendUsername.trim()) {
            alert('Please enter a username to search.');
            return;
        }

        try {
            const response = await fetch(
                `http://${process.env.EXPO_PUBLIC_SERVER_URL}/users/search`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await getToken()}`,
                    },
                    body: JSON.stringify({ username: friendUsername })
                },
            );

            if (response.ok) {
                const data = await response.json();
                if (data.userId) {
                    const friendUserId = data.userId;
                    addFriend(friendUserId); // Add the found friend by their userId
                } else {
                    alert('User not found');
                }
            } else {
                console.error('Failed to search for friend:', response.statusText);
                alert('Error searching for user');
            }
        } catch (error) {
            console.error('Error searching for friend:', error);
            alert('Error searching for user');
        }
    };

    // Handle selecting a chat (for demonstration purposes)
    const onSelectChat = (roomId: string | number) => {
        router.push(`/friends/chat/${roomId}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.friendsList}>
                <Text style={styles.pageTitle}>Friends</Text>

                {friends.map((friend, index) => (
                    <Pressable key={index} onPress={() => onSelectChat(friend.roomId)} style={styles.friendItemContainer}>
                        <ProfilePicture userId={friend.userId} styling={styles.friendProfilePicture} />
                        <Text style={styles.friendUsername}>{friend.username}</Text>
                    </Pressable>
                ))}

                {/* Button to show the Add Friend modal */}
                <Button title="Add Friend" onPress={() => setModalVisible(true)} />
            </ScrollView>

            {/* Add Friend Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
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
                            <Button title="Cancel" onPress={() => setModalVisible(false)} />
                            <Button title="Send" onPress={handleAddFriend} />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#222',
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

export default Friends;
