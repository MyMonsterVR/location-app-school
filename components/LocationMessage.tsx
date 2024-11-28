import React, {useEffect, useState} from "react";
import * as Location from "expo-location";
import {View, StyleSheet, Pressable} from "react-native";
import {Text} from "@/components/ui/text";

import MapView, { Marker } from 'react-native-maps';
import {useMapContext} from "@/context/MapContext";
import {router} from "expo-router";

const LocationMessage = React.memo(({ locationData, isOwnMessage }) => {
    const [address, setAddress] = useState('Loading address...');
    const { latitude, longitude } = JSON.parse(locationData);

    const {
        origin,
        setOrigin,
        destination,
        setDestination,
    } = useMapContext();

    const getAddressFromCoordinates = async (latitude, longitude) =>
    {
        try
        {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted')
            {
                console.error('Permission to access location was denied');
                return null;
            }

            const result = await Location.reverseGeocodeAsync({latitude, longitude});

            if (result.length > 0)
            {
                const address = result[0];
                return `${address.street || ''}, ${address.city || ''}, ${address.region ? address.region + ',' : ''} ${address.country || ''}`;
            } else
            {
                console.log('No address found');
                return null;
            }
        } catch (error)
        {
            console.error('Error getting address:', error);
            return null;
        }
    };

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                const result = await getAddressFromCoordinates(latitude, longitude);
                setAddress(result || 'Address not found');
            } catch (error) {
                console.error('Error parsing location data:', error);
                setAddress('Invalid location data');
            }
        };

        fetchAddress();
    }, [locationData]);

    const handleAccept = () => {
        console.log('Accepted location:', { latitude, longitude });
        // You can add more functionality here, like opening in maps app
        setDestination({ latitude, longitude });
        router.push('/map');
    };

    return (
        <View style={[
            styles.locationMessageContainer,
            isOwnMessage ? styles.userLocationMessage : styles.otherUserLocationMessage
        ]}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
            >
                <Marker coordinate={{ latitude, longitude }} />
            </MapView>
            <Text style={styles.locationText}>{address}</Text>
            {!isOwnMessage && (
                <Pressable onPress={handleAccept} style={styles.acceptButton}>
                    <Text style={styles.acceptButtonText}>Accept Location</Text>
                </Pressable>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    locationMessageContainer: {
        width: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 10,  // You can adjust this based on how much space you need between messages
    },
    userLocationMessage: {
        alignSelf: 'flex-end',
    },
    otherUserLocationMessage: {
        alignSelf: 'flex-start',
    },
    centeredLocationMessage: {
        alignSelf: 'center', // This will center the user's location message
    },
    map: {
        width: '100%',
        height: 100,
    },
    locationText: {
        color: '#333',
        fontSize: 12,
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    acceptButton: {
        backgroundColor: '#0078d4',
        padding: 8,
        alignItems: 'center',
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default LocationMessage;