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
import MapView, {LatLng, Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/Ionicons';
import {getItem, setItem} from "@/utils/AsyncStorage";
import Speedometer from "@/components/Speedometer";
import {debounce} from "@/utils/utils";
import {darkModeMapStyling, trackModeMapStyling} from "@/lib/mapStyles";
import {useAuth} from "@clerk/clerk-expo";
import {useFriends} from "@/hooks/useFriends";
import FriendMarker from "@/components/FriendMarker";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import BottomSheet, {BottomSheetView} from "@gorhom/bottom-sheet";
import ProfilePicture from "@/components/ProfilePicture";
import {useTheme} from "@react-navigation/native";
import {router} from "expo-router";
import {useMapContext} from "@/context/MapContext";
import ShareDestination from "@/components/ShareDestination";

const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_API;
const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

export default function Map()
{
    const {
        origin,
        setOrigin,
        destination,
        setDestination,
        recentRoutes,
        setRecentRoutes,
        mapDarkMode,
        mapTrackMode,
        darkModeEnabled,
        trackModeEnabled
    } = useMapContext();
    const [searchText, setSearchText] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<definitions.SearchResult[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [mapTheme, setMapTheme] = useState<Record<string, unknown>[]>([]);
    const [friendDetails, setFriendDetails] = useState<definitions.Friend[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<definitions.Friend | null>(null);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    const [isSearchModalVisible, setSearchModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isThrottled, setIsThrottled] = useState(false);
    const [speed, setSpeed] = useState(0);
    const [isUserInteracting, setIsUserInteracting] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(true);

    const mapRef = useRef<MapView | null>(null);
    const lastPosition = useRef<definitions.Location | null>(null);
    const stationaryTimer = useRef<NodeJS.Timeout | null>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);

    const stationaryThreshold = 10;
    const stationaryTimeout = 2000;
    const throttleDuration = 2000; // 2 seconds

    const {userId, getToken} = useAuth();
    const {friends} = useFriends(userId as string, getToken);

    const theme = useTheme();

    // Save recent route with destination address only
    const saveRecentRoute = async (coords: definitions.Location, destinationAddress: string) =>
    {
        const routes = await getItem('@recent_routes');
        const savedRoutes = routes ? JSON.parse(routes) : [];
        const newRoute = {coords, destination: destinationAddress};

        // Avoid adding duplicates
        if (!savedRoutes.some(route => route.destination === destinationAddress))
        {
            savedRoutes.unshift(newRoute);
            await setItem('@recent_routes', JSON.stringify(savedRoutes.slice(0, 5))); // Keep the last 5 routes

            // Update recent routes state to trigger re-render
            setRecentRoutes(savedRoutes);
        }
    };

    const debouncedSearchPlaces = debounce(async (input: string | null) =>
    {
        if (!input || !input.trim().length)
        {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);

        // Cancel the previous fetch if it's still pending
        if (abortController)
        {
            abortController.abort(); // abort previous request
        }

        const newAbortController = new AbortController(); // create new controller
        setAbortController(newAbortController); // update state

        const googleApisUrl = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
        const url = `${googleApisUrl}?input=${input}&location=${origin?.latitude},${origin?.longitude}&key=${GOOGLE_MAPS_APIKEY}`;

        try
        {
            const resp = await fetch(url, {signal: newAbortController.signal}); // attach abort signal
            const json = await resp.json();

            if (resp.ok && json.status === "OK" && json.predictions)
            {
                setSearchResults(json.predictions);
            } else
            {
                setSearchResults([]); // Reset if no valid predictions
            }
        } catch (error)
        {
            if (error.name === 'AbortError')
            {
                console.log('Fetch request was aborted');
            } else
            {
                console.log(error);
            }
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

                const coords = {latitude: location.lat, longitude: location.lng}

                goToMyLocation()
                setDestination(coords);
                setSearchResults([]);
                setSearchModalVisible(false);
                setIsUserInteracting(false);

                await saveRecentRoute(coords, address);
            }
        } catch (error)
        {
            console.log(error);
        }
    };

    const goToMyLocation = async () =>
    {
        let currentLocation = await Location.getCurrentPositionAsync({});

        mapRef.current?.animateToRegion({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        })
    }

    const getDistance = (latLng1: definitions.Location, latLng2: definitions.Location): number =>
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

    const updateLocationDBThrottle = async (location: definitions.Location): Promise<void> =>
    {
        if (isThrottled) return; // Prevent further calls if throttled

        setIsThrottled(true); // Set throttling on
        await updateLocationDB(location);

        // Set a timer to reset the throttle after a duration
        setTimeout(() =>
        {
            setIsThrottled(false);
        }, throttleDuration);
    };

    const updateLocationDB = async (location: definitions.Location): Promise<void> =>
    {
        // Destructure latitude and longitude from the location parameter
        const {latitude, longitude} = location;

        if (!userId) return;

        // Optional: Basic validation
        if (latitude === undefined || longitude === undefined) return;

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

            // fetch locations
            await fetchFriendLocations();
        } catch (error)
        {
            console.error('Error updating location:', error);
        }
    };

    const fetchFriendLocations = async () =>
    {
        const locations = await fetch(`http://${SERVER_URL}/friends/getInfo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`,
            },
            body: JSON.stringify({userIds: friends.map(friend => friend.userId)}),
        });

        if (!locations.ok)
        {
            throw new Error('Failed to fetch locations');
        }

        const data = await locations.json();
        setFriendDetails(data.locations || []);
    }

    useEffect(() =>
    {
        if (origin)
        {
            updateLocationDBThrottle(origin);
        }
    }, [origin]);

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
                    accuracy: Location.Accuracy.BestForNavigation,
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

                    if (!isUserInteracting)
                    {
                        const {latitude, longitude} = location.coords;
                        // Simply update origin without forcing the map to the new location
                        setOrigin({latitude, longitude});
                    }
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
    }, [isUserInteracting]);

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
        fetchFriendLocations();
        goToMyLocation();
    }, []);

    const handleFriendPress = (friend) =>
    {
        // merge friends.find(f => f.userId === selectedFriend.userId) and friend
        const mergedFriend = {
            ...friends.find(f => f.userId === friend.userId),
            ...friend,
        }

        setSelectedFriend(mergedFriend);

        bottomSheetRef.current?.expand(); // Expand the bottom sheet when a friend is selected
    };

    const handleClosePress = () =>
    {
        bottomSheetRef.current?.close(); // Close bottom sheet
    };

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
        <GestureHandlerRootView style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                showsUserLocation={true}
                showsMyLocationButton={false}
                loadingEnabled={true}
                provider={PROVIDER_GOOGLE}
                customMapStyle={mapTheme}
                showsTraffic={!!destination}
                onRegionChange={() =>
                {
                    setIsUserInteracting(true);
                }}
            >
                {origin && destination && (
                    <MapViewDirections
                        origin={origin}
                        destination={destination}
                        apikey={GOOGLE_MAPS_APIKEY}
                        timePrecision={'now'}
                        mode="DRIVING" // Default transport mode
                        strokeWidth={8}
                        strokeColor="#34a4eb"
                        splitWaypoints={true}
                    />
                )}
                {destination && (
                    <Marker
                        coordinate={destination}
                        title="Destination"
                        description="Your destination"
                    />
                )}
                {friendDetails.map((friend, index) => (
                    <Marker
                        key={index}
                        coordinate={friend.coords}
                        onPress={() => handleFriendPress(friend as definitions.Friend)}
                    >
                        <FriendMarker userId={friend.userId}/>
                    </Marker>
                ))}
            </MapView>
            <Speedometer speed={speed}/>
            <TouchableOpacity style={styles.searchIconButton} onPress={() => setSearchModalVisible(true)}>
                <Icon name="search" size={30} color="#FFF"/>
            </TouchableOpacity>
            {destination && <ShareDestination selectedDestination={destination}/>}
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
                                renderItem={({item}) => (
                                    <TouchableOpacity onPress={() =>
                                    {
                                        setDestination(item.coords); // Set destination when clicked.
                                        setSearchModalVisible(false); // Close the modal
                                    }}>
                                        <View style={styles.resultItem}>
                                            <View style={styles.resultItemContainer}>
                                                <Icon name="time-outline" size={20} color="#FFA500"
                                                      style={styles.recentIcon}/>
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
                        renderItem={({item}) => (
                            <TouchableOpacity onPress={() =>
                            {
                                if (item.place_id)
                                {
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
            <BottomSheet
                ref={bottomSheetRef}
                index={-1} // Start closed
                snapPoints={['25%']}
                onChange={(index) =>
                {
                    if (index === -1) setSelectedFriend(null); // Reset selected friend when closed
                }}
                enablePanDownToClose={true}
            >
                <BottomSheetView style={styles.contentContainer(theme)}>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClosePress}>
                        <Icon name="close" size={24} color="#fff"/>
                    </TouchableOpacity>
                    {selectedFriend ? (
                        <View style={styles.userContainer}>
                            <ProfilePicture userId={selectedFriend.userId}/>
                            <Text style={styles.userName(theme)}>{selectedFriend.username}</Text>
                            <TouchableOpacity
                                style={styles.chatButton}
                                onPress={() => router.push(`/friends/chat/${selectedFriend.roomId}`)}
                            >
                                <Text style={styles.chatButtonText}>Start Chat</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={styles.noUserText}>Select a friend to chat</Text>
                    )}
                </BottomSheetView>
            </BottomSheet>
        </GestureHandlerRootView>
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
    contentContainer: (theme) => ({
        flex: 1,
        padding: 20,
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    }),
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10, // Move the icon to the right side
        backgroundColor: 'transparent',
        padding: 10,
    },
    userContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    userName: (theme) => ({
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    }),
    userLocation: {
        fontSize: 16,
        color: '#777',
        marginBottom: 15,
    },
    chatButton: {
        backgroundColor: '#0086d0',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    chatButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    noUserText: {
        fontSize: 16,
        color: '#777',
    },
});
