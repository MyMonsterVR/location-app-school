import { useState, useEffect } from 'react';
import { Friend } from '@/types';

export const useFriends = (userId: string | null, getToken: () => Promise<string | null>) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchFriends = async () => {
        if (!userId) return;

        try {
            setIsLoading(true);
            const token = await getToken();
            const response = await fetch(`http://${process.env.EXPO_PUBLIC_SERVER_URL}/friends`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch friends');
            }

            const data = await response.json();
            setFriends(data.friends || []);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends();
    }, [userId]);

    return { friends, isLoading, error, refetch: fetchFriends };
};