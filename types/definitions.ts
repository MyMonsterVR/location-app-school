namespace definitions {
    export interface Location {
        latitude: number;
        longitude: number;
    }

    export interface CurrentLocation {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    }

    export interface Friend {
        userId: string;
        username: string;
        coords: Location;
    }

    export interface SearchResult {
        place_id: string;
        description: string;
    }

    export interface User
    {
        username: string;
        userId: string;
    }

    export interface Message
    {
        _id: string;
        createdAt: string;
        updatedAt: string;
        message: {
            text: string;
            messageType: 'text' | 'gif' | 'image' | 'location';
            readby: string[];
        };
        room: {
            roomId: string;
        };
        user: {
            userId: string;
            username: string;
        }[];
    }
}