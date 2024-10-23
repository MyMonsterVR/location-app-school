import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TextInput, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import MapViewDirections from 'react-native-maps-directions';
import MapView, { LatLng, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Pressable } from 'expo-router/build/views/Pressable';

const destination = { latitude: 56.1629, longitude: 10.2039 };
const GOOGLE_MAPS_APIKEY = 'AIzaSyDVv71QIEt1ymIvRM-VgiDSg7p1bToQ864';

export default function Index() {
    const [location, setLocation] = useState<CurrentLocation | null>(null);
    const [origin, setOrigin] = useState<OriginLocation | null>(null);
    const [searchText, setSearchText] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const mapRef = useRef<MapView | null>(null);
    const mapDarkMode = [ { "elementType": "geometry", "stylers": [ { "color": "#242f3e" } ] }, { "elementType": "labels.text.fill", "stylers": [ { "color": "#746855" } ] }, { "elementType": "labels.text.stroke", "stylers": [ { "color": "#242f3e" } ] }, { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [ { "color": "#d59563" } ] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [ { "color": "#d59563" } ] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [ { "color": "#263c3f" } ] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [ { "color": "#6b9a76" } ] }, { "featureType": "road", "elementType": "geometry", "stylers": [ { "color": "#38414e" } ] }, { "featureType": "road", "elementType": "geometry.stroke", "stylers": [ { "color": "#212a37" } ] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [ { "color": "#9ca5b3" } ] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [ { "color": "#746855" } ] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [ { "color": "#1f2835" } ] }, { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [ { "color": "#f3d19c" } ] }, { "featureType": "transit", "elementType": "geometry", "stylers": [ { "color": "#2f3948" } ] }, { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [ { "color": "#d59563" } ] }, { "featureType": "water", "elementType": "geometry", "stylers": [ { "color": "#17263c" } ] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [ { "color": "#515c6d" } ] }, { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [ { "color": "#17263c" } ] } ]
    const mapTrackMode = [ { "elementType": "geometry", "stylers": [ { "color": "#242f3e" } ] }, { "elementType": "labels.text.fill", "stylers": [ { "color": "#d56363" } ] }, { "elementType": "labels.text.stroke", "stylers": [ { "color": "#242f3e" } ] }, { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [ { "color": "#d56363" } ] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [ { "color": "#d56363" } ] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [ { "color": "#263c3f" } ] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [ { "color": "#6b9a76" } ] }, { "featureType": "road", "elementType": "geometry", "stylers": [ { "color": "#4C3636"} ] }, { "featureType": "road", "elementType": "geometry.stroke", "stylers": [ { "color": "#212a37" } ] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [ { "color": "#9ca5b3" } ] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [ { "color": "#744040" } ] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [ { "color": "#1f2835" } ] }, { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [ { "color": "#F39C9C" } ] }, { "featureType": "transit", "elementType": "geometry", "stylers": [ { "color": "#2f3948" } ] }, { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [ { "color": "#FF5733" } ] }, { "featureType": "water", "elementType": "geometry", "stylers": [ { "color": "#17263c" } ] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [ { "color": "#6D5151" } ] }, { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [ { "color": "#17263c" } ] } ]

    const searchPlaces = async () => {
        console.log(`Searching: ${JSON.stringify(searchText)}`);
        if (searchText == null || !searchText.trim().length) return;

        const googleApisUrl = "https://maps.googleapis.com/maps/api/place/textsearch/json";
        const input = searchText;
        const location = `${origin?.latitude},${origin?.longitude}&radius=2000`;
        const url = `${googleApisUrl}?query=${input}&location=${location}&key=${GOOGLE_MAPS_APIKEY}`;

        try {
            const resp = await fetch(url);
            const json = await resp.json();

            if (json && json.results) {
                setSearchResults(json.results);
            }

            console.log(searchResults);
        } catch (error) {
            console.log(error);
        }
    };

    const selectLocation = (location: LatLng) => {
        setOrigin(location);
        setSearchResults([]);
        mapRef.current?.animateToRegion({
            ...location,
            latitudeDelta: 0.0092,
            longitudeDelta: 0.0092,
        }, 1000);
    };
    useEffect(() => {
        try {
            (async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    return;
                }

                let location = await Location.getCurrentPositionAsync({});
                setLocation(location as unknown as CurrentLocation);
                if (location?.coords) {
                    Location.watchPositionAsync(
                        {
                            accuracy: Location.Accuracy.Balanced,
                            timeInterval: 100,
                            distanceInterval: 50
                        },
                        location => {
                            setLocation(location as unknown as CurrentLocation);
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

    let text = 'Waiting..';
    if (errorMsg) {
        text = errorMsg;
        return (
            <View>
                <Text>Location not found</Text>
                <Text>{text}</Text>
                <Text>{JSON.stringify(location)}</Text>
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
            >
                <MapViewDirections
                    origin={origin}
                    destination={destination}
                    apikey={GOOGLE_MAPS_APIKEY}
                    mode="DRIVING"
                />
            </MapView>
            <TextInput
                style={styles.searchInput}
                placeholder={'Search'}
                placeholderTextColor={'#666'}
                onChangeText={setSearchText}
            />
            <Pressable onPress={searchPlaces} style={styles.searchButton}>
                <Text>Search</Text>
            </Pressable>
            <FlatList
                data={searchResults}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => selectLocation({
                        latitude: item.geometry.location.lat,
                        longitude: item.geometry.location.lng,
                    })}>
                        <View style={styles.resultItem}>
                            <Text>{item.name}</Text>
                            <Text>{item.formatted_address}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                style={styles.resultsList}
            />
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
    searchInput: {
        position: 'absolute',
        borderRadius: 10,
        margin: 10,
        color: '#000',
        borderColor: '#666',
        backgroundColor: '#FFF',
        borderWidth: 1,
        height: 45,
        paddingHorizontal: 10,
        fontSize: 18,
        alignSelf: 'center',
        width: Dimensions.get('window').width / 1.05,
    },
    searchButton: {
        position: 'absolute',
        borderRadius: 10,
        margin: 60,
        borderColor: '#666',
        backgroundColor: '#FFF',
        borderWidth: 1,
        height: 45,
        paddingHorizontal: 10,
        alignSelf: 'center',
    },
    resultsList: {
        position: 'absolute',
        top: 100,
        width: Dimensions.get('window').width / 1.05,
        alignSelf: 'center',
        backgroundColor: '#FFF',
        borderRadius: 10,
        borderColor: '#666',
        borderWidth: 1,
    },
    resultItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
});