import { ScrollView, Pressable, TextInput, View, Button } from 'react-native';
import { Text } from '~/components/ui/text';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import faye from 'faye';
import InputText from '@/components/InputText';
import { getItem } from "@/app/utils/AsyncStorage";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '~/components/ui/card';

const ROOM_ID = 'room1'; // Room name
const SERVER_URL = 'http://20.157.195.19'; // Your backend URL

const Friends = () => {
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [message, setMessage] = useState('');
    const [userID, setUserID] = useState(null);
    let ws = useRef<WebSocket|null>(null).current;

    useEffect(() => {
        const getUserId = async () => {
            const userId = await getItem('userId');
            setUserID(userId);
        };
        getUserId();

        // Connect to WebSocket server
        ws = new WebSocket(`${SERVER_URL}:8080/chat`);

        ws.onopen = () => {
            console.log('Connected to WebSocket server');
            // Join the room
            ws.send(JSON.stringify({ type: 'join', room: ROOM_ID, userId: userID ?? 0 }));
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'history') {
                setMessages(data.messages); // Fetch history on connect
            } else if (data.type === 'message') {
                setMessages((prevMessages) => [...prevMessages, data]);
            }
        };

        return () => {
            if (ws) ws.close();
        };
    }, []);

    const sendMessage = () => {
        if (message.trim() === '') return;

        // Send message to backend via HTTP API
        fetch(`${SERVER_URL}:80/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                room: ROOM_ID,
                userId: userID ?? 0,
                text: message,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Message sent successfully:', data);
                // Optionally, update the local state immediately
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { userId: userID ?? 0, text: message, type: 'message' },
                ]);
                setMessage(''); // Clear input after sending
            })
            .catch((error) => {
                console.error('Error sending message:', error);
            });
    };

    const messagesList = messages.map((data, index) => (
        <Text key={index} className='text-white dark:text-white'>
            {data.userId}: {data.text}
        </Text>
    ));

    return (
        <SafeAreaView>
            <ScrollView>
                {error && (
                    <Card className='w-full max-w-sm'>
                        <CardHeader>
                            <CardTitle>Card Title</CardTitle>
                            <CardDescription>Card Description</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Text>{error}</Text>
                        </CardContent>
                        <CardFooter>
                            <Pressable className="bg-blue-600 rounded p-4 hover:bg-blue-400" onPress={() => {setRetryCount(0); setError(null)}}>
                                <Text>Retry</Text>
                            </Pressable>
                        </CardFooter>
                    </Card>
                )}

                <Text>Friends</Text>
                {messagesList}

                {/* Input Text */}
                <TextInput
                    placeholder="Type a message"
                    value={message}
                    onChangeText={setMessage}
                    style={{
                        borderWidth: 1,
                        margin: 10,
                        padding: 10,
                        backgroundColor: '#fff',
                        borderRadius: 5,
                    }}
                />

                {/* Send Button */}
                <Pressable onPress={sendMessage} style={{ backgroundColor: '#4CAF50', padding: 10, margin: 10, borderRadius: 5 }}>
                    <Text style={{ color: 'white', textAlign: 'center' }}>Send</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Friends;
