import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    initialized: boolean;
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
    setLoading: (loading: boolean) => void;
    setInitialized: (initialized: boolean) => void;
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    loading: true,
    initialized: false,

    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setLoading: (loading) => set({ loading }),
    setInitialized: (initialized) => set({ initialized }),

    signOut: async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            set({
                user: null,
                session: null,
                loading: false,
            });
        } catch (error) {
            console.error("Error signing out:", error);
        }
    },

    initialize: async () => {
        try {
            set({ loading: true });

            // Get current session
            const { data: { session }, error } = await supabase.auth
                .getSession();

            if (error) {
                console.error("Error getting session:", error);
            } else {
                set({
                    user: session?.user ?? null,
                    session: session ?? null,
                });
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (event, session) => {
                console.log("Auth state changed:", event, session?.user?.email);

                set({
                    user: session?.user ?? null,
                    session: session ?? null,
                    loading: false,
                });

                // Create or update user profile when signed in
                if (event === "SIGNED_IN" && session?.user) {
                    await createOrUpdateUserProfile(session.user);
                }
            });
        } catch (error) {
            console.error("Error initializing auth:", error);
        } finally {
            set({
                loading: false,
                initialized: true,
            });
        }
    },
}));

// Helper function to create or update user profile
async function createOrUpdateUserProfile(user: User) {
    try {
        const { error } = await supabase
            .from("profiles")
            .upsert({
                id: user.id,
                email: user.email!,
                full_name: user.user_metadata?.full_name || "",
                avatar_url: user.user_metadata?.avatar_url || null,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: "id",
            });

        if (error) {
            console.error("Error upserting user profile:", error);
        }
    } catch (error) {
        console.error("Error creating/updating user profile:", error);
    }
}
