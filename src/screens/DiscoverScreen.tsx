import Ionicons from '@expo/vector-icons/Ionicons';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Carousel from 'react-native-reanimated-carousel';

import ImageDiscover from '../components/ImageDiscover';
import VideoDiscover from '../components/VideoDiscover';
import config from '../config';
import { getToken } from '../state/auth';
import { ExtendedMedia, Media } from '../types';
import { asyncHandler, request } from '../util';

declare type Props = {
    navigation: NavigationProp<ParamListBase>;
};

function DiscoverScreen({ navigation }: Props) {
    const [media, setMedia] = useState<ExtendedMedia[]>([]);

    async function updateMedia() {
        const responseData = await request('GET', 'info/all_media', getToken());
        const data = responseData.media as Media[];
        const media: ExtendedMedia[] = data
            .filter((el) => el.fileAvailable)
            .map((el) => {
                const file = el.type == 'image' ? 'high.jpg' : 'index.m3u8';
                return {
                    ...el,
                    src: `${config.BASE_URL}/media/${el.type}/${el.id}/${file}`,
                };
            });
        setMedia(media);
    }

    const width = Dimensions.get('window').width;
    // var height = Dimensions.get('window').height;
    var height = 500

    useEffect(() => {
        // Use `setOptions` to update the button that we previously specified
        // Now the button includes an `onPress` handler to update the discoverData
        navigation.setOptions({
            headerRight: () => (
                <Ionicons
                    name="refresh-outline"
                    size={32}
                    color="black"
                    onPress={asyncHandler(updateMedia, { prefix: 'Failed to update media' })}
                    style={{
                        marginRight: 10,
                    }}
                />
            ),
        });

        // Get appropriate height for carousel
        height = Dimensions.get('window').height;
    }, [navigation, height]);

    return (
        <View style={styles.container}>
            { media.length == 0 ? (
            <View style={styles.sadContainer}>
                <Ionicons
                    name="sad-outline"
                    size={50}
                    color="black"
                    style={styles.sadIcon}
                />
                <Text style={styles.sadText}>Seems like there are no clips right now...</Text>
            </View>
            ) : (
            <GestureHandlerRootView>
                <Carousel
                    vertical={true}
                    width={width}
                    height={500}
                    autoPlay={false}
                    loop={false}
                    data={media}
                    scrollAnimationDuration={450}
                    renderItem={({ item, index }) => (
                        <>
                            {item.type === 'video' ? (
                                <VideoDiscover
                                    discoverData={media[index]}
                                    navigation={navigation}
                                />
                            ) : (
                                <ImageDiscover
                                    discoverData={media[index]}
                                    navigation={navigation}
                                />
                            )}
                        </>
                    )}
                />
            </GestureHandlerRootView>
            )
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sadContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    sadIcon: {
        marginBottom: 20
    },
    sadText: {
        fontSize: 20
    }
});

export default DiscoverScreen;
