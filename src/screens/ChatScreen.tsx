import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import Message from '../components/Message';
import { Message as MessageModel, MessageManager } from '../models/message';
import { EventDetailProps } from '../nav/types';
import { useUserStore } from '../state/user';
import { asyncHandler } from '../util';

function ChatScreen({ route }: EventDetailProps<'Chat'>) {
    const eventId = route.params?.eventId ?? null;
    const userId = useUserStore((state) => state.currentUserId);
    const [messages, setMessages] = useState<MessageModel[]>();
    const [text, setText] = useState();
    const textInputRef = React.createRef();

    const scrollViewRef = useRef();

    const refreshMessages = useCallback(() => {
        asyncHandler(
            async () => {
                // TODO: scroll to end if new message added
                const data = await MessageManager.fetchMessages(eventId);
                setMessages(data);
            },
            { prefix: 'Failed to load messages' }
        )();
    }, [eventId]);

    useFocusEffect(
        useCallback(() => {
            // initial load
            refreshMessages();

            // set up continuous refresh
            const id = setInterval(refreshMessages, 1000);
            return () => clearInterval(id);
        }, [refreshMessages])
    );

    async function sendMessage(text: string) {
        return await MessageManager.sendMessage(eventId, text);
    }

    return (
        <View style={styles.container}>
            <View style={styles.chatArea}>
                <SafeAreaView style={{ display: 'flex' }}>
                    <ScrollView
                        ref={scrollViewRef}
                        onContentSizeChange={() =>
                            scrollViewRef.current?.scrollToEnd({ animated: false })
                        }
                    >
                        {messages ? (
                            messages.map((e, i) => (
                                <Message key={`message-${i}`} message={messages[i]} />
                            ))
                        ) : (
                            <></>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </View>
            <View style={styles.menuArea}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Message..."
                    onChangeText={(t) => {
                        setText(t);
                    }}
                    ref={textInputRef}
                />
                <View style={styles.sendButton}>
                    <Ionicons
                        name="send"
                        size={25}
                        color={'#fcba03'}
                        onPress={asyncHandler(
                            async () => {
                                await sendMessage(text);
                                textInputRef.current.clear();
                            },
                            { prefix: 'Failed to send message' }
                        )}
                    ></Ionicons>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    chatArea: {
        flex: 1,
        // backgroundColor: 'red'
    },
    menuArea: {
        height: 65,
        // backgroundColor: 'blue'
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    textInput: {
        height: 40,
        // width: '80%',
        flex: 1,
        marginLeft: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderRadius: 8,
    },
    sendButton: {
        height: 40,
        width: 40,
        // borderWidth: 1,
        borderRadius: 8,
        marginHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ChatScreen;
