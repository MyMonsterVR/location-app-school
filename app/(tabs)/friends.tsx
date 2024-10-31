import {ScrollView, View, Pressable} from 'react-native';
import { Text } from '~/components/ui/text';
import React, {useEffect} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import socketIOClient from 'socket.io-client';
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
    const socketio = socketIOClient('http://20.157.195.19:80');
    const [messages, setMessages] = React.useState<string[]>([]);
    const [error, setError] = React.useState<string>(null);

    useEffect(() => {
        socketio.on("connect_error", (err) => {
            console.log(`connect_error due to ${err.message}`);
            setError(`connect_error due to ${err.message}`)

            //errorModal(err.message)
        });

        socketio.on('chat', (msg: string) => {
            setMessages(msg);
            console.log('received messages', msg)
        })

        socketio.on('message', (msg: string) => {
            setMessages((prevMsg) => [...prevMsg, msg]);
        })

        return () => {
            socketio.off('chat');
            socketio.off('message');
        }
    }, []);

    const addMessage = async (chat: string) => {
        const newChat = {
            userId: await getItem('userId') ?? 0,
            message: chat,
            roomId: 'a+4'
        }

        socketio.emit('newMessage', newChat)
    }

    const messagesList = messages.map((data, index) => {
        console.log(messages)
        return <Text className="text-black dark:text-white" key={index}>{data.message}</Text>
    })

    const errorModal = (msg: string) => {
        console.log(msg)
        return (
            <View>
                <Card className='w-full max-w-sm'>
                    <CardHeader>
                        <CardTitle>Card Title</CardTitle>
                        <CardDescription>Card Description</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Text>Card Content</Text>
                    </CardContent>
                    <CardFooter>
                        <Text>Card Footer</Text>
                    </CardFooter>
                </Card>
            </View>
        )
    }

    return (
        <SafeAreaView>
            <ScrollView>
                <Text>Friends</Text>
                {messagesList}
                <Pressable style={{ backgroundColor: 'red' }} onPress={() => errorModal('hello')}>
                    <Text>Trigger error</Text>
                </Pressable>
                <InputText addMessage={addMessage} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default Friends;