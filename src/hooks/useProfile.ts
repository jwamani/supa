import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useProfileStore } from "../store/profileStore";
import { useAuthStore } from "../store/authStore";

export interface UserProfile {
    id: string;
    username?: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
    bio?: string;
    preferences?: {
        theme?: "light" | "dark";
        notifications?: {
            email?: boolean;
            mentions?: boolean;
            comments?: boolean;
            shares?: boolean;
        };
        editor?: {
            auto_save?: boolean;
            spell_check?: boolean;
            word_wrap?: boolean;
        };
    };
    is_active?: boolean;
    last_active_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface UseProfile {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

export const useProfile = () => {
    const { user } = useAuthStore();
    const {
        currentProfile,
        loading,
        updating,
        error,
        fetchProfile,
        updateProfile,
        setCurrentProfile,
        invalidateCache,
    } = useProfileStore();

    useEffect(() => {
        if (user?.id) {
            fetchProfile(user.id).then(profile => {
                setCurrentProfile(profile);
            }).catch(console.error);
        } else {
            setCurrentProfile(null);
        }
    }, [user?.id, fetchProfile, setCurrentProfile]);

    const updateCurrentProfile = async (updates: Partial<UserProfile>) => {
        if (!user?.id) throw new Error('No user logged in');
        const updated = await updateProfile(user.id, updates);
        setCurrentProfile(updated);
        return updated;
    };

    const refreshProfile = async () => {
        if (!user?.id) return;
        const profile = await fetchProfile(user.id, true);
        setCurrentProfile(profile);
    };

    return {
        profile: currentProfile,
        loading,
        updating,
        error,
        updateProfile: updateCurrentProfile,
        refreshProfile,

        fetchUserProfile: fetchProfile, // fetch any user's profile
        invalidateCache,// clear cache when needed
    };
};
