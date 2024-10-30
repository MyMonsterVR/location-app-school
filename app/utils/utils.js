import {getItem} from "./AsyncStorage";

export const isLoggedIn = () => {
    async function isTokenValid(user) {
        const response = await fetch('http://20.157.195.19/api/validateToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: { token: await getItem('token') },
        });

        // TODO: REMOVE
        if(!response.ok) return true;

        return response.json().valid;
    }

    return isTokenValid();
}
export const mapStyle = () => {
    async function getStyle() {
        const darkMode = await getItem('toggleDarkMode');
        const trackMode = await getItem('toggleTrackMode');

        return {
            darkMode: darkMode,
            trackMode: trackMode,
        };
    }
    return getStyle();
}
