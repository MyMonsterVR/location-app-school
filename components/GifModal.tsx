import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, FlatList, Pressable, StyleSheet, Dimensions, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Text } from '~/components/ui/text';
import {debounce} from "@/utils/utils";

interface GifModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSelectGif: (gifUrl: string, type: 'gif') => void;
}

const GifModal: React.FC<GifModalProps> = ({ isVisible, onClose, onSelectGif }) => {
    const [gifSearch, setGifSearch] = useState<string>('');
    const [gifs, setGifs] = useState<any[]>([]);
    const [pos, setPos] = useState<string>('');  // Position for pagination (Tenor's `pos` parameter)
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);

    const debouncedSearchGifs = useRef(
        debounce(async (searchTerm: string, pos: string) => {
            if (!searchTerm.trim()) return;
            setLoading(true);

            try {
                const response = await fetch(
                    `https://tenor.googleapis.com/v2/search?q=${searchTerm}&key=${process.env.EXPO_PUBLIC_TENOR_KEY}&limit=20&pos=${pos}`
                );

                const data = await response.json();

                if (pos === '') {
                    // Reset GIFs on new search
                    setGifs(data.results);
                } else {
                    // Append GIFs if not on the first search
                    setGifs((prevGifs) => [...prevGifs, ...data.results]);
                }

                // Determine if there are more GIFs to load
                setHasMore(data.results.length === 20);  // If we received 20 GIFs, there's more to load
                setPos(data.next || '');  // Set the new `pos` value for the next request
            } catch (error) {
                console.error('Error fetching GIFs:', error);
            } finally {
                setLoading(false);
            }
        }, 500)
    ).current;

    useEffect(() => {
        if (gifSearch) {
            setPos('');  // Reset `pos` for the new search
            setHasMore(true);  // Ensure more GIFs can be loaded again
            debouncedSearchGifs(gifSearch, '');  // Start a fresh search
        }
    }, [gifSearch]);

    const loadMoreGifs = () => {
        if (loading || !hasMore || !pos) return;  // Avoid loading more if already fetching or no more results
        debouncedSearchGifs(gifSearch, pos);  // Use the `pos` to load the next set of GIFs
    };

    const insertGif = (gif: any) => {
        onSelectGif(gif.media_formats.gif.url, 'gif');
        onClose();
    };

    const closeGifModal = () => {
        onClose();
        setGifSearch('');
        setGifs([]);
    };

    return (
        <Modal visible={isVisible} animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.gifHeader}>
                    <TextInput
                        value={gifSearch}
                        onChangeText={setGifSearch}
                        placeholder="Search for GIFs"
                        style={styles.searchInput}
                    />
                    <Pressable onPress={() => closeGifModal()} style={styles.closeButton}>
                        <Icon name="close" size={24} color="#fff" />
                    </Pressable>
                </View>

                <FlatList
                    data={gifs}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => {
                        const gif = item.media_formats.tinygif;
                        const isTallGif = gif.width < gif.height;
                        return (
                            <Pressable
                                onPress={() => insertGif(item)}
                                style={[styles.gifThumbnailContainer, isTallGif && styles.tallGifThumbnail]}
                            >
                                <Image
                                    source={{ uri: gif.url }}
                                    style={[styles.gifThumbnail, isTallGif && styles.tallGifThumbnailImage]}
                                    cachePolicy="memory-disk"
                                />
                            </Pressable>
                        );
                    }}
                    numColumns={2}
                    contentContainerStyle={styles.gifsContainer}
                    onEndReached={loadMoreGifs}  // Trigger loading more GIFs when reaching the bottom
                    onEndReachedThreshold={0.5}  // Start loading more when 50% of the list is visible
                    ListFooterComponent={loading ? <Text>Loading more...</Text> : null}  // Footer to show loading status
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#222',
    },
    gifHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#333',
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 5,
        fontSize: 16,
    },
    closeButton: {
        padding: 10,
    },
    gifsContainer: {
        flexDirection: 'column',
        padding: 10,
    },
    gifThumbnailContainer: {
        width: '48%',
        margin: '1%',
    },
    gifThumbnail: {
        width: '100%',
        height: Dimensions.get('window').height / 4, // Adjust the height based on your needs
        borderRadius: 10,
        contentFit: 'cover',
    },
    tallGifThumbnail: {
        width: '100%',
        height: 200,
    },
    tallGifThumbnailImage: {
        height: '100%',
        contentFit: 'cover',
    },
});

export default GifModal;