import { supabase } from "../lib/supabaseClient";
import { create } from "zustand";
import type { Database } from "../lib/types";
import type { UserProfile } from "../hooks/useProfile";
import type { User } from "@supabase/supabase-js";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfileState {
    profiles: Record<string, UserProfile>; // userId -> profile (O(1) lookup)
    currentProfile: UserProfile | null;
    
    loading: boolean;
    updating: boolean;
    error: string | null;

    lastFetch: Record<string, number>; // userId -> timestamp (O(1) lookup)
    cacheExpiry: number;
}

interface ProfileActions {
    // data mutations
    setProfile: (userId: string, profile: UserProfile) => void;
    setCurrentProfile: (profile: UserProfile | null) => void;

    // ui state mutations
    setLoading: (loading: boolean) => void;
    setUpdating: (updating: boolean) => void;
    setError: (error: string | null) => void;

    // smart operations
    fetchProfile: (userId: string, forceRefresh?: boolean) => Promise<UserProfile | null>;
    updateProfile: (userId: string, updates: Partial<UserProfile>) => Promise<UserProfile>;
    shouldRefetch: (userId: string) => boolean;

    // cache management
    invalidateCache: (userId?: string) => void;
}

export const useProfileStore = create<ProfileState & ProfileActions>((set, get) => ({
    // initial state
    profiles: {},
    currentProfile: null,
    loading: false,
    updating: false,
    error: null,
    lastFetch: {},
    cacheExpiry: 5 * 60 * 1000,
    
    // state mutations
    setProfile: (userId, profile) => {
        set(state => ({
            profiles: { ...state.profiles, [userId]: profile },
            lastFetch: {...state.lastFetch, [userId]: Date.now()}
        }));
    },

    setCurrentProfile: (profile) => set({ currentProfile: profile }),
    setLoading: (loading) => set({ loading }),
    setUpdating: (updating) => set({ updating }),
    setError: (error) => set({ error }),
    
    // caching
    shouldRefetch: (userId) => {
        const lastFetchTime = get().lastFetch[userId] || 0;
        const cacheAge = Date.now() - lastFetchTime;
        return cacheAge > get().cacheExpiry;
    },

    // cache managemeent
    invalidateCache: (userId) => {
        if (userId) {
            // invalidate specific user
            set(state => {
                const newLastFetch = { ...state.lastFetch };
                delete newLastFetch[userId];
                const newProfiles = { ...state.profiles };
                delete newProfiles[userId];

                return { lastFetch: newLastFetch, profiles: newProfiles };
            });
        } else {
            set({ lastFetch: {}, profiles: {} });
        }
    },
    // database operations
    fetchProfile: async (userId, forceRefresh = false) => {
        // check for cache
        const cachedProfile = get().profiles[userId];

        if (!forceRefresh && cachedProfile && !get().shouldRefetch(userId)) {
            return cachedProfile;
        } 
        // prevent race conditions
        if (get().loading && !forceRefresh) {
            return get().profiles[userId] || null;
        }

        try {
            set({ loading: true, error: null });

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error) {
                if (error.code === "PGRST116") {
                    // profile doesnt exist, expected for new users
                    return null;
                }
                throw error;
            }

            // cache the result
            get().setProfile(userId, data);

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user profile';
            set({ error: errorMessage });
            throw new Error(errorMessage);
        } finally {
            set({ loading: false });
        }
    },

    // optimistic updates
    updateProfile: async (userId, updates) => {
        const currentProfile = get().profiles[userId];

        if (!currentProfile) {
            throw new Error('Profile not found in cache');
        }
        // optimistic update
        const optimisticProfile = { ...currentProfile, ...updates };
        get().setProfile(userId, optimisticProfile);

        try {
            set({ updating: true, error: null });

            const { data, error } = await supabase
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)
                .select()
                .single();
            
            if (error) throw error;

            // replace optimistic with real data
            get().setProfile(userId, data);

            return data;
        } catch (err) {
            get().setProfile(userId, currentProfile);

            const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
            set({ error: errorMessage });
            throw new Error(errorMessage);
        }
        finally {
            set({ updating: false });
        }
    }
}))