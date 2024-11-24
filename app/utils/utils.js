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

export const debounce = (func: Function, delay: number) => {
    let timer: NodeJS.Timeout;
    return (...args: any[]) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
};