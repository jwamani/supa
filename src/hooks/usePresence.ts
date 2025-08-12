import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';

interface PresenceState {
    user_id: string;
    full_name: string;
    cursor_position?: { x: number; y: number };
    typing_status: boolean;
    last_seen: string;
}

export const usePresence = (documentId: string) => {
    const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
    const { user } = useAuthStore();

    useEffect(() => {
        if (!documentId || !user) return;

        const channel = supabase.channel(`presence:${documentId}`)
            .on('presence', { event: 'sync' }, () => {
                const presenceState = channel.presenceState();
                // Extract user data from presence state - each key contains an array of presence objects
                const users = Object.values(presenceState)
                    .flat()
                    .filter((presence: any) => presence.user_id) // Only include valid user data
                    .map((presence: any) => ({
                        user_id: presence.user_id,
                        full_name: presence.full_name,
                        cursor_position: presence.cursor_position,
                        typing_status: presence.typing_status,
                        last_seen: presence.last_seen
                    })) as PresenceState[];
                setOnlineUsers(users);
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                console.log('New users joined:', newPresences);
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                console.log('Users left:', leftPresences);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track user presence
                    await channel.track({
                        user_id: user.id,
                        full_name: user.user_metadata?.full_name || user.email,
                        typing_status: false,
                        last_seen: new Date().toISOString()
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [documentId, user]);

    const updateTypingStatus = async (isTyping: boolean) => {
        if (!user) return;

        const channel = supabase.channel(`presence:${documentId}`);
        await channel.track({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email,
            typing_status: isTyping,
            last_seen: new Date().toISOString()
        });
    };

    return { onlineUsers, updateTypingStatus };
};