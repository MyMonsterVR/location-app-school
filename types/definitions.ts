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
}