// context/MapContext.tsx
import React, {createContext, useContext, useState, useEffect} from 'react';
import {getItem, setItem} from '@/utils/AsyncStorage';
import {darkModeMapStyling, trackModeMapStyling} from "@/lib/mapStyles";

const MapContext = createContext(null);

export const MapProvider = ({children}) =>
{
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [recentRoutes, setRecentRoutes] = useState([]);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [trackModeEnabled, setTrackModeEnabled] = useState(false);

    const mapDarkMode = darkModeMapStyling
    const mapTrackMode = trackModeMapStyling

    const handleMapstyle = async () =>
    {
        const darkMode = await getItem('toggleDarkMode');
        const trackMode = await getItem('toggleTrackMode');

        if (darkModeEnabled !== darkMode) setDarkModeEnabled(darkMode);
        if (trackModeEnabled !== trackMode) setTrackModeEnabled(trackMode);
    }

    useEffect(() =>
    {
        const loadRecentRoutes = async () =>
        {
            const storedRoutes = await getItem('@recent_routes');
            if (storedRoutes)
            {
                setRecentRoutes(JSON.parse(storedRoutes));
            }
        };

        loadRecentRoutes();
        handleMapstyle();
    }, []);

    useEffect(() =>
    {
        const interval = setInterval(handleMapstyle, 1000)

        return () => clearInterval(interval)
    }, [darkModeEnabled, trackModeEnabled]);

    useEffect(() =>
    {
        const saveRecentRoutes = async () =>
        {
            await setItem('@recent_routes', JSON.stringify(recentRoutes));
        };
        saveRecentRoutes();
    }, [recentRoutes]);

    return (
        <MapContext.Provider value={
            {
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
            }}>
            {children}
        </MapContext.Provider>
    );
};

export const useMapContext = () => useContext(MapContext);