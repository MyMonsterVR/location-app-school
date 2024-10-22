import { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Platform } from "react-native";
import MapViewDirections from 'react-native-maps-directions';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
/*
const origin = {latitude: 37.3318456, longitude: -122.0296002};
const destination = {latitude: 37.771707, longitude: -122.4053769};
const GOOGLE_MAPS_APIKEY = 'AIzaSyDVv71QIEt1ymIvRM-VgiDSg7p1bToQ864';
 */



/* <MapViewDirections
          origin={origin}
          destination={destination}
          apikey={GOOGLE_MAPS_APIKEY}
        /> */

export default function Index() {
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const mapRef = useRef(null);

    useEffect(() => {
        Location.enableNetworkProviderAsync()
        try {
            (async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    return;
                }

                let location = await Location.getCurrentPositionAsync({});
                setLocation(location);
                if (location?.coords)
                {
                    const region = {
                        latitudeDelta:  0.0092,
                        longitudeDelta: 0.0092,
                        latitude:       location.coords.latitude,
                        longitude:      location.coords.longitude,
                    };

                    console.log("latitude: ", region.latitude);
                    console.log("longitude: ", region.longitude);
                    mapRef.current?.animateToRegion(region, 1000);
                }
            })();
        }
        catch (ex)
        {
            console.log(ex)
        }
    }, []);

    let text = 'Waiting..';
    if (errorMsg)
    {
        text = errorMsg;
        return (
            <View>
                <Text>Location not found</Text>
                <Text>{text}</Text>
                <Text>{JSON.stringify(location)}</Text>
            </View>
        )
    }
    else if (location)
    {
        text = JSON.stringify(location);
    }

    return (
        <View style={styles.container} provider={PROVIDER_GOOGLE}>
            <MapView
                ref={mapRef}
                style={styles.map}
                showsUserLocation={true}>
            </MapView>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
});