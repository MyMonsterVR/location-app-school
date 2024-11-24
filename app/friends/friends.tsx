import React, { useCallback, useState } from 'react';
import { ScrollView, Pressable, StyleSheet, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import ProfilePicture from '@/components/ProfilePicture';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import AddFriendModal from "@/components/AddFriendModal";
import Icon from "react-native-vector-icons/Ionicons";
import { useFriends } from "@/hooks/useFriends";
import { useTheme } from '@react-navigation/native';

const Friends: React.FC = () => {
    const { userId, getToken } = useAuth();
    const [isModalVisible, setModalVisible] = useState(false);
    const { friends, isLoading, error, refetch } = useFriends(userId as string, getToken);
    const [refreshing, setRefreshing] = useState(false);
    const theme = useTheme();

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const onSelectChat = useCallback((roomId: string) => {
        router.push(`/friends/chat/${roomId}`);
    }, []);

    if (error) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    Error loading friends. Please try again later.
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.friendsList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                <View style={[styles.headerContainer, { borderBottomColor: theme.colors.border }]}>
                    <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Friends</Text>
                    <Pressable
                        onPress={() => setModalVisible(true)}
                        style={[styles.addFriendButton, { backgroundColor: theme.colors.secondary }]}
                    >
                        <Icon name="person-add" size={24} color={theme.colors.text} />
                    </Pressable>
                </View>

                {isLoading ? (
                    <Text style={{ color: theme.colors.text }}>Loading friends...</Text>
                ) : (
                    friends.map((friend) => (
                        <Pressable
                            key={friend.userId}
                            onPress={() => onSelectChat(friend.roomId)}
                            style={[styles.friendItemContainer, { borderBottomColor: theme.colors.border }]}
                        >
                            <ProfilePicture userId={friend.userId} styling={styles.friendProfilePicture}/>
                            <Text style={[styles.friendUsername, { color: theme.colors.text }]}>{friend.username}</Text>
                        </Pressable>
                    ))
                )}
            </ScrollView>

            <AddFriendModal
                isVisible={isModalVisible}
                onClose={() => setModalVisible(false)}
                onAddFriend={refetch}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    pageTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    addFriendButton: {
        padding: 8,
        borderRadius: 20,
    },
    friendsList: {
        paddingBottom: 20,
    },
    friendItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    friendProfilePicture: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    friendUsername: {
        fontSize: 18,
        fontWeight: '600',
    },
    errorText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        paddingHorizontal: 20,
    },
});

export default Friends;