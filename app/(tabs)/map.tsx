import React, {useState, useEffect, useRef} from 'react';
import {
    Text,
    View,
    StyleSheet,
    TextInput,
    Dimensions,
    FlatList,
    TouchableOpacity,
    Modal,
    Pressable
} from 'react-native';
import MapViewDirections from 'react-native-maps-directions';
import MapView, {LatLng, PROVIDER_GOOGLE} from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/Ionicons';
import {getItem, setItem} from "@/utils/AsyncStorage";
import Speedometer from "@/components/Speedometer";
import {debounce} from "@/utils/utils";
import {darkModeMapStyling, trackModeMapStyling} from "@/lib/mapStyles";
import {useAuth} from "@clerk/clerk-expo";

const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_API;

export default function Map()
{
    const [origin, setOrigin] = useState<OriginLocation | null>(null);
    const [destination, setDestination] = useState<DestinationLocation | null>(null);
    const [searchText, setSearchText] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [mapTheme, setMapTheme] = useState<Record<string, unknown>[]>([]);
    const [recentRoutes, setRecentRoutes] = useState<string[]>([]);

    const [isSearchModalVisible, setSearchModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [trackModeEnabled, setTrackModeEnabled] = useState(false);
    const [isThrottled, setIsThrottled] = useState(false);
    const [speed, setSpeed] = useState(0);

    const mapRef = useRef<MapView | null>(null);
    const lastPosition = useRef(null);
    const stationaryTimer = useRef(null);

    const stationaryThreshold = 10;
    const stationaryTimeout = 2000;
    const throttleDuration = 5000; // 5 seconds

    const {userId, getToken} = useAuth();


    const mapDarkMode = darkModeMapStyling
    const mapTrackMode = trackModeMapStyling

    const loadRecentRoutes = async () =>
    {
        const routes = await getItem('@recent_routes');
        if (routes)
        {
            setRecentRoutes(JSON.parse(routes));
        }
    };

    // Save recent route with destination address only
    const saveRecentRoute = async (destinationAddress: string) => {
        const routes = await getItem('@recent_routes');
        const savedRoutes = routes ? JSON.parse(routes) : [];
        const newRoute = { destination: destinationAddress };

        // Avoid adding duplicates
        if (!savedRoutes.some(route => route.destination === destinationAddress)) {
            savedRoutes.unshift(newRoute);
            await setItem('@recent_routes', JSON.stringify(savedRoutes.slice(0, 5))); // Keep the last 5 routes

            // Update recent routes state to trigger re-render
            setRecentRoutes(savedRoutes);
        }
    };

    const debouncedSearchPlaces = debounce(async (input) =>
    {
        if (!input || !input.trim().length)
        {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        const googleApisUrl = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
        const url = `${googleApisUrl}?input=${input}&location=${origin?.latitude},${origin?.longitude}&key=${GOOGLE_MAPS_APIKEY}`;

        try
        {
            const resp = await fetch(url);
            const json = await resp.json();
            if (json.status === "OK" && json.predictions)
            {
                setSearchResults(json.predictions);
            } else
            {
                setSearchResults([]); // Reset if no valid predictions
            }
        } catch (error)
        {
            console.log(error);
        } finally
        {
            setIsLoading(false);
        }
    }, 300);

    const selectLocation = async (placeId: string) =>
    {
        const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${GOOGLE_MAPS_APIKEY}`;

        try
        {
            const resp = await fetch(placeDetailsUrl);
            const json = await resp.json();
            if (json.status === "OK")
            {
                const location = json.result.geometry.location;
                const address = json.result.formatted_address;

                setDestination({latitude: location.lat, longitude: location.lng});
                setSearchResults([]);
                setSearchModalVisible(false);

                const originAddress = origin ? `${origin.latitude}, ${origin.longitude}` : "Current Location";
                await saveRecentRoute(address);
            }
        } catch (error)
        {
            console.log(error);
        }
    };

    const getDistance = (latLng1, latLng2) =>
    {
        const rad = (x) => (x * Math.PI) / 180;
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = rad(latLng2.latitude - latLng1.latitude);
        const dLon = rad(latLng2.longitude - latLng1.longitude);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rad(latLng1.latitude)) * Math.cos(rad(latLng2.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // Distance in meters
    };

    const handleMapstyle = async () =>
    {
        const darkMode = await getItem('toggleDarkMode');
        const trackMode = await getItem('toggleTrackMode');

        if (darkModeEnabled !== darkMode) setDarkModeEnabled(darkMode);
        if (trackModeEnabled !== trackMode) setTrackModeEnabled(trackMode);
    }

    useEffect(() =>
    {
        debouncedSearchPlaces(searchText);
    }, [searchText]);

    useEffect(() =>
    {
        (async () =>
        {
            let {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted')
            {
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            if (location?.coords)
            {
                const initialRegion = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                };
                setOrigin(initialRegion);
                mapRef.current?.animateToRegion(initialRegion, 0);
            }

            const locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    distanceInterval: 1, // Trigger location update every 1 meter
                    timeInterval: 1000, // Trigger location update every second
                },
                (location) =>
                {
                    const {latitude, longitude, speed} = location.coords;
                    setOrigin({latitude, longitude});

                    // Calculate distance from last known position
                    if (lastPosition.current)
                    {
                        const distance = getDistance(lastPosition.current, {latitude, longitude});

                        // If the distance is less than the threshold
                        if (distance < stationaryThreshold)
                        {
                            // If there's a real movement detected before stopping
                            if (speed > 0)
                            {
                                setSpeed(speed * 3.6); // Convert speed to km/h
                                if (stationaryTimer.current)
                                {
                                    clearTimeout(stationaryTimer.current);
                                }

                                stationaryTimer.current = setTimeout(() =>
                                {
                                    setSpeed(0);
                                }, stationaryTimeout);
                            }
                        } else
                        {
                            setSpeed(speed * 3.6); // Update speed if moving
                            if (stationaryTimer.current)
                            {
                                clearTimeout(stationaryTimer.current);
                            }
                        }
                    } else
                    {
                        setSpeed(speed * 3.6); // Capture speed at first location
                    }

                    lastPosition.current = {latitude, longitude};

                    // Check if we reached the destination within 15 meters
                    if (destination)
                    {
                        const distanceToDestination = getDistance({latitude, longitude}, destination);
                        if (distanceToDestination <= 15)
                        {
                            setDestination(null); // Reset destination
                        }
                    }

                    const region = {
                        latitude,
                        longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    };
                    mapRef.current?.animateToRegion(region, 100);
                }
            );

            return () =>
            {
                locationSubscription && locationSubscription.remove();
                if (stationaryTimer.current)
                {
                    clearTimeout(stationaryTimer.current);
                }
            };
        })();
    }, [destination]);

    const updateLocationDBThrottle = async (latitude, longitude) => {
        if (isThrottled) return; // Prevent further calls if throttled

        setIsThrottled(true); // Set throttling on
        await updateLocationDB(latitude, longitude);

        // Set a timer to reset the throttle after a duration
        setTimeout(() => {
            setIsThrottled(false);
        }, throttleDuration);
    };

    useEffect(() => {
        if (origin) {
            updateLocationDBThrottle(origin.latitude, origin.longitude);
        }
    }, [origin]);

    const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

    const updateLocationDB = async (latitude: number, longitude: number) =>
    {
        if(!userId) return;

        if(!latitude || !longitude) return;

        try
        {
            const token = await getToken();
            const response = await fetch(
                `http://${SERVER_URL}/user/location`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({userId, latitude, longitude}),
                }
            );

            if (!response.ok)
            {
                throw new Error('Failed to update location');
            }
        } catch (error)
        {
            console.error('Error updating location:', error);
        }
    }

    useEffect(() =>
    {
        const interval = setInterval(handleMapstyle, 1000)

        return () => clearInterval(interval)
    }, [darkModeEnabled, trackModeEnabled]);

    useEffect(() =>
    {
        setMapTheme(
            trackModeEnabled
                ? mapTrackMode
                : darkModeEnabled
                    ? mapDarkMode
                    : []
        )
    }, [darkModeEnabled, trackModeEnabled]);

    useEffect(() =>
    {
        loadRecentRoutes();
    }, []);

    let text = 'Waiting...';
    if (errorMsg)
    {
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
                customMapStyle={mapTheme}
                showsTraffic={true}
            >
                {origin && (
                    <MapViewDirections
                        origin={origin}
                        destination={destination}
                        apikey={GOOGLE_MAPS_APIKEY}
                        mode="DRIVING" // Default transport mode
                        strokeWidth={8}
                        strokeColor="#34a4eb"
                    />
                )}
            </MapView>
            <Speedometer speed={speed}/>
            <TouchableOpacity style={styles.searchIconButton} onPress={() => setSearchModalVisible(true)}>
                <Icon name="search" size={30} color="#FFF"/>
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
                    {searchText === null || searchText.trim().length === 0 ? ( // Show recent routes when search text is empty
                        <>
                            <Text style={styles.recentRoutesHeader}>Recent Locations</Text>
                            <FlatList
                                data={recentRoutes}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity onPress={() => {
                                        setDestination(item.destination); // Set destination when clicked.
                                        setSearchModalVisible(false); // Close the modal
                                    }}>
                                        <View style={styles.resultItem}>
                                            <View style={styles.resultItemContainer}>
                                                <Icon name="time-outline" size={20} color="#FFA500" style={styles.recentIcon} />
                                                <Text style={styles.resultTitle}>{item.destination}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        </>
                    ) : null}

                    <FlatList
                        data={searchResults}
                        keyExtractor={(item) => item.place_id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => {
                                if (item.place_id) {
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
                        <Icon name="chevron-down-outline" size={28} color="#FFF"/>
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
    recentIcon: {
        marginRight: 10, // Space between icon and title
    },
    resultItemContainer: {
        flexDirection: 'row', // Aligns children horizontally
        alignItems: 'center', // Centers items vertically
    },
    recentRoutesHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 10,
        paddingLeft: 10,
    },
    speedContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: 10,
        borderRadius: 5,
        zIndex: 1000, // Ensures it's on top of the map
    },
    searchIconButton: {
        position: 'absolute',
        bottom: 30,
        right: 20, // Moved to the right side
        backgroundColor: '#0086d0',
        padding: 15,
        borderRadius: 50,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
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
        shadowOffset: {width: 0, height: -4},
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
        backgroundColor: '#0086d0', // Change this color to match your theme
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
        backgroundColor: '#0086d0',
        padding: 10,
        borderRadius: 30,
        elevation: 5,
    },
});
