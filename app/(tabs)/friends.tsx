import {Text, ScrollView} from 'react-native';
import React, {useEffect} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import socketIOClient from 'socket.io-client';
import InputText from '@/components/InputText';
import { getItem } from "@/app/utils/AsyncStorage";

const Friends = () => {
    const socketio = socketIOClient('http://20.157.195.19:3000');
    const [messages, setMessages] = React.useState<string[]>([]);

    useEffect(() => {
        socketio.on("connect_error", (err) => {
            console.log(`connect_error due to ${err.message}`);
        });

        socketio.on('chat', (msg: string) => {
            setMessages(msg);
        })

        socketio.on('message', (msg: string) => {
            setMessages((prevMsg) => [...prevMsg, msg]);
        })

        return () => {
            socketio.off('chat');
            socketio.off('message');
        }
    }, []);

    const sendMessage = (msg: string) => {
        socketio.emit('chat', msg);
    }

    const addMessage = async (chat: string) => {
        const newChat = {
            userId: await getItem('userId') ?? 0,
            message: chat,
            roomId: 'a+4'
        }

        socketio.emit('newMessage', newChat)

        const msgToSend = [...messages, newChat]
        setMessages(msgToSend)
        sendMessage(msgToSend)
    }

    const messagesList = messages.map((data, index) => {
        console.log(messages)
        return <Text key={index}>{data.message}</Text>
    })

    return (
        <SafeAreaView>
            <ScrollView>
                <Text>Friends</Text>
                {messagesList}
                <InputText addMessage={addMessage} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default Friends;