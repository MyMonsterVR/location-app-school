import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TextInput, Dimensions, FlatList, TouchableOpacity, Modal, Pressable } from 'react-native';
import MapViewDirections from 'react-native-maps-directions';
import MapView, { LatLng, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/Ionicons';
import { setItem } from "@/app/utils/AsyncStorage";

const GOOGLE_MAPS_APIKEY = 'AIzaSyDVv71QIEt1ymIvRM-VgiDSg7p1bToQ864';

export default function Map() {
    const [origin, setOrigin] = useState<OriginLocation | null>(null);
    const [destination, setDestination] = useState<DestinationLocation | null>(null);
    const [searchText, setSearchText] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSearchModalVisible, setSearchModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const mapRef = useRef<MapView | null>(null);
    setItem('userId', 1)

    const mapDarkMode = [ { "elementType": "geometry", "stylers": [ { "color": "#242f3e" } ] }, { "elementType": "labels.text.fill", "stylers": [ { "color": "#746855" } ] }, { "elementType": "labels.text.stroke", "stylers": [ { "color": "#242f3e" } ] }, { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [ { "color": "#d59563" } ] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [ { "color": "#d59563" } ] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [ { "color": "#263c3f" } ] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [ { "color": "#6b9a76" } ] }, { "featureType": "road", "elementType": "geometry", "stylers": [ { "color": "#38414e" } ] }, { "featureType": "road", "elementType": "geometry.stroke", "stylers": [ { "color": "#212a37" } ] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [ { "color": "#9ca5b3" } ] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [ { "color": "#746855" } ] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [ { "color": "#1f2835" } ] }, { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [ { "color": "#f3d19c" } ] }, { "featureType": "transit", "elementType": "geometry", "stylers": [ { "color": "#2f3948" } ] }, { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [ { "color": "#d59563" } ] }, { "featureType": "water", "elementType": "geometry", "stylers": [ { "color": "#17263c" } ] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [ { "color": "#515c6d" } ] }, { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [ { "color": "#17263c" } ] } ]
    const mapTrackMode = [ { "elementType": "geometry", "stylers": [ { "color": "#242f3e" } ] }, { "elementType": "labels.text.fill", "stylers": [ { "color": "#d56363" } ] }, { "elementType": "labels.text.stroke", "stylers": [ { "color": "#242f3e" } ] }, { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [ { "color": "#d56363" } ] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [ { "color": "#d56363" } ] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [ { "color": "#263c3f" } ] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [ { "color": "#6b9a76" } ] }, { "featureType": "road", "elementType": "geometry", "stylers": [ { "color": "#4C3636"} ] }, { "featureType": "road", "elementType": "geometry.stroke", "stylers": [ { "color": "#212a37" } ] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [ { "color": "#9ca5b3" } ] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [ { "color": "#744040" } ] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [ { "color": "#1f2835" } ] }, { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [ { "color": "#F39C9C" } ] }, { "featureType": "transit", "elementType": "geometry", "stylers": [ { "color": "#2f3948" } ] }, { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [ { "color": "#FF5733" } ] }, { "featureType": "water", "elementType": "geometry", "stylers": [ { "color": "#17263c" } ] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [ { "color": "#6D5151" } ] }, { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [ { "color": "#17263c" } ] } ]

    // https://gist.github.com/ca0v/73a31f57b397606c9813472f7493a940
    // Prevents calling the same function multiple times within a given time
    const debounce = <T extends (...args: any[]) => any>(
        callback: T,
        waitFor: number
    ) => {
        let timeout: ReturnType<typeof setTimeout>;
        return (...args: Parameters<T>): ReturnType<T> => {
            let result: any;
            timeout && clearTimeout(timeout);
            timeout = setTimeout(() => {
                result = callback(...args);
            }, waitFor);
            return result;
        };
    };

    const debouncedSearchPlaces = debounce(async (input) => {
        if (!input || !input.trim().length) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        const googleApisUrl = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
        const url = `${googleApisUrl}?input=${input}&location=${origin?.latitude},${origin?.longitude}&key=${GOOGLE_MAPS_APIKEY}`;

        try {
            const resp = await fetch(url);
            const json = await resp.json();
            if (json.status === "OK" && json.predictions) {
                setSearchResults(json.predictions);
            } else {
                setSearchResults([]); // Reset if no valid predictions
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }, 300);

    const selectLocation = async (placeId: string) => {
        const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${GOOGLE_MAPS_APIKEY}`;

        try {
            const resp = await fetch(placeDetailsUrl);
            const json = await resp.json();
            if (json.status === "OK") {
                const location = json.result.geometry.location;

                setDestination({ latitude: location.lat, longitude: location.lng });
                setSearchResults([]); // Clear results after selection
                setSearchModalVisible(false); // Close modal
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        debouncedSearchPlaces(searchText);
    }, [searchText]);

    useEffect(() => {
        try {
            (async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    return;
                }

                let location = await Location.getCurrentPositionAsync({});
                if (location?.coords) {
                    Location.watchPositionAsync(
                        {
                            accuracy: Location.Accuracy.Balanced,
                            timeInterval: 100,
                            distanceInterval: 50
                        },
                        location => {
                            const region = {
                                latitudeDelta: 0.0092,
                                longitudeDelta: 0.0092,
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                            };
                            mapRef.current?.animateToRegion(region, 1000);
                            setOrigin(region);
                        }
                    );
                }
            })();
        } catch (ex) {
            console.log(ex);
        }
    }, []);

    let text = 'Waiting...';
    if (errorMsg) {
        text = errorMsg;
        return (
            <View>
                <Text>{text}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                showsUserLocation={true}
                showsMyLocationButton={false}
                loadingEnabled={true}
                provider={PROVIDER_GOOGLE}
                customMapStyle={mapDarkMode}
                showsTraffic={true}
            >
                {origin && (
                    <MapViewDirections
                        origin={origin}
                        destination={destination}
                        apikey={GOOGLE_MAPS_APIKEY}
                        mode="DRIVING"
                        strokeWidth={8}
                        strokeColor="#34a4eb"
                    />
                )}
            </MapView>
            <TouchableOpacity style={styles.searchIconButton} onPress={() => setSearchModalVisible(true)}>
                <Icon name="search" size={30} color="#FFF" />
            </TouchableOpacity>
            <Modal
                visible={isSearchModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <TextInput
                        style={styles.modalSearchInput}
                        placeholder="Search for a location"
                        placeholderTextColor="#666"
                        onChangeText={setSearchText}
                    />

                    <FlatList
                        data={searchResults}
                        keyExtractor={(item) => item.place_id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => {
                                if (item.place_id) { // Check if place_id exists
                                    selectLocation(item.place_id);
                                }
                            }}>
                                <View style={styles.resultItem}>
                                    <Text style={styles.resultTitle}>{item.description}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />

                    <TouchableOpacity onPress={() => setSearchModalVisible(false)} style={styles.goBackButton}>
                        <Icon name="chevron-down-outline" size={28} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    searchIconButton: {
        position: 'absolute',
        bottom: 30,
        right: 20, // Moved to the right side
        backgroundColor: '#34a4eb',
        padding: 15,
        borderRadius: 50,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(36, 47, 62, 1)', // TODO: dark mode fixed
        justifyContent: 'flex-end', // Slide-up effect
    },
    modalContent: {
        backgroundColor: '#FFF', // White background
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 8, // Added elevation for depth
    },
    modalSearchInput: {
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        color: '#333',
        marginBottom: 15,
    },
    modalSearchButton: {
        borderRadius: 10,
        margin: 10,
        backgroundColor: '#34a4eb', // Change this color to match your theme
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3, // Adds a subtle shadow for modern effect
    },
    resultsList: {
        marginTop: 10,
    },
    resultItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE', // Light separator for clarity
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff', // TODO: CHANGE BASED ON THEME COLOR
    },
    resultSubtitle: {
        fontSize: 14,
        color: '#777',
        marginTop: 2,
    },
    goBackButton: {
        alignSelf: 'center',
        marginBottom: 10,
        backgroundColor: '#34a4eb',
        padding: 10,
        borderRadius: 30,
        elevation: 5,
    },
});
