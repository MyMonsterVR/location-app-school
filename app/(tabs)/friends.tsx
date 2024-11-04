import { ScrollView, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import React, {useEffect, useRef, useState} from 'react';
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

const Friends = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState<number>(0);
    const isConnected = useRef(false);

    const fayeClient = new faye.Client('http://20.157.195.19/faye', {
        timeout: 120,
        interval: 10,
    });
    const CHANNEL_ID = "test_channel";

    const MAX_RETRIES = 5;
    const RETRY_DELAY = 5000; // 5 seconds

    const subscribeToChannel = (retry = 0) => {
        const subscription = fayeClient.subscribe(`/messages/${CHANNEL_ID}`, (data: any) => {
            console.log("Received message:", data);
            setMessages((prevMessages) => [...prevMessages, data.message]);
        });

        subscription.then(
            () => {
                console.log(`Successfully subscribed to /messages/${CHANNEL_ID}`);
            },
            (error: any) => {
                console.error(`Failed to subscribe: ${error.message}`);
                setError(`Subscription failed: ${error.message}`);
                if (retry < MAX_RETRIES) {
                    setTimeout(() => subscribeToChannel(retry + 1), RETRY_DELAY);
                } else {
                    console.error('Max subscription retries reached.');
                }
            }
        );
    };

    useEffect(() => {
        const handleConnection = () => {
            if (!isConnected.current) {
                console.log('Connected to Faye server');
                setError(null)
                subscribeToChannel();
                setRetryCount(0); // Reset retry count on successful connection
                isConnected.current = true;
            }
        };

        const handleDisconnection = () => {
            if (isConnected.current) {
                console.log('Disconnected from Faye server, attempting to reconnect...');
                isConnected.current = false;
                if (retryCount < MAX_RETRIES) {
                    setTimeout(() => {
                        fayeClient.connect();
                        setRetryCount(retryCount + 1);
                    }, RETRY_DELAY);
                } else {
                    console.error('Max retries reached. Could not reconnect to Faye server.');
                    setError('Max retries reached. Could not reconnect to Faye server.');
                }
            }
        };

        fayeClient.bind('transport:up', handleConnection);
        fayeClient.bind('transport:down', handleDisconnection);
        fayeClient.unsubscribe(`/messages/${CHANNEL_ID}`);
        fayeClient.connect();

        return () => {
            fayeClient.unbind('transport:up', handleConnection);
            fayeClient.unbind('transport:down', handleDisconnection);
            fayeClient.disconnect();
        };
    }, [retryCount]);

    const addMessage = async (chat: string) => {
        const newChat = {
            userId: await getItem('userId') ?? 0,
            message: chat,
            roomId: CHANNEL_ID
        };

        fetch('http://20.157.195.19:80/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newChat),
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    const messagesList = messages.map((data, index) => {
        return <Text className='text-white dark:text-white' key={index}>{data.message}</Text>;
    });

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
                            <Pressable className="bg-blue-600 rounded p-4 hover:bg-blue-400" onPress={() => {setRetryCount(0); fayeClient.connect(); setError(null)}}>
                                <Text>Retry</Text>
                            </Pressable>
                        </CardFooter>
                    </Card>
                )}
                <Text>Friends</Text>
                {messagesList}
                <InputText addMessage={addMessage} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default Friends;