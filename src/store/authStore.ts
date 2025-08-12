import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    initialized: boolean;
    authMode: 'email' | 'phone'; // 🔄 NEW: Track current auth mode
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
    setLoading: (loading: boolean) => void;
    setInitialized: (initialized: boolean) => void;
    setAuthMode: (mode: 'email' | 'phone') => void; // 🔄 NEW: Switch auth mode
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
    // � EMAIL authentication methods
    signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
    // 📱 PHONE authentication methods
    signInWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
    verifyPhoneOTP: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    loading: true,
    initialized: false,
    authMode: 'email', // 🔄 DEFAULT: Start with email auth

    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setLoading: (loading) => set({ loading }),
    setInitialized: (initialized) => set({ initialized }),
    setAuthMode: (mode) => {
        console.log(`🔄 Switching auth mode to: ${mode}`);
        set({ authMode: mode });
    },

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

    // 📱 PHONE AUTHENTICATION: Send OTP to Uganda phone number
    signInWithPhone: async (phone: string) => {
        try {
            set({ loading: true });

            const { error } = await supabase.auth.signInWithOtp({
                phone: phone,
                options: {
                    channel: 'sms',
                }
            });

            if (error) {
                console.error('❌ Error sending OTP:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ OTP sent successfully to:', phone);
            return { success: true };
        } catch (error) {
            console.error('💥 Unexpected error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
            return { success: false, error: errorMessage };
        } finally {
            set({ loading: false });
        }
    },

    // 🔐 VERIFY PHONE OTP: Confirm the SMS code
    verifyPhoneOTP: async (phone: string, token: string) => {
        try {
            set({ loading: true });

            console.log('🔐 Verifying OTP with params:', { phone, token, type: 'sms' });

            // 🔧 ATTEMPT 1: Standard format
            const { data, error } = await supabase.auth.verifyOtp({
                phone,
                token,
                type: 'sms'
            });

            if (error) {
                console.error('❌ Error verifying OTP:', error);
                // Add more detailed error logging
                console.error('❌ Error details:', {
                    message: error.message,
                    status: error.status,
                    phone: phone,
                    tokenLength: token.length
                });

                // 🔧 ATTEMPT 2: Try alternative format if first attempt fails
                if (error.message.includes('Only an email address or phone number should be provided')) {
                    console.log('🔄 Trying alternative OTP verification format...');

                    const { data: data2, error: error2 } = await supabase.auth.verifyOtp({
                        type: 'sms',
                        phone: phone,
                        token: token
                    });

                    if (error2) {
                        return { success: false, error: error2.message };
                    }

                    console.log('✅ Phone verification successful (attempt 2):', data2.user?.phone);
                    return { success: true };
                }

                return { success: false, error: error.message };
            }

            // The auth state change will be handled by onAuthStateChange listener
            console.log('✅ Phone verification successful:', data.user?.phone);
            return { success: true };
        } catch (error) {
            console.error('💥 Unexpected error during verification:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP';
            return { success: false, error: errorMessage };
        } finally {
            set({ loading: false });
        }
    },

    // 📧 EMAIL AUTHENTICATION: Sign in with email and password
    signInWithEmail: async (email: string, password: string) => {
        try {
            set({ loading: true });

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('❌ Error signing in with email:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Email sign-in successful:', data.user?.email);
            return { success: true };
        } catch (error) {
            console.error('💥 Unexpected error during email sign-in:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
            return { success: false, error: errorMessage };
        } finally {
            set({ loading: false });
        }
    },

    // 📧 EMAIL AUTHENTICATION: Sign up with email and password
    signUpWithEmail: async (email: string, password: string, fullName?: string) => {
        try {
            set({ loading: true });

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName || '',
                    }
                }
            });

            if (error) {
                console.error('❌ Error signing up with email:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Email sign-up successful:', data.user?.email);
            return { success: true };
        } catch (error) {
            console.error('💥 Unexpected error during email sign-up:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
            return { success: false, error: errorMessage };
        } finally {
            set({ loading: false });
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
                // 📱 PHONE AUTH: Handle both email and phone users
                email: user.email || null,
                phone: user.phone || null,
                full_name: user.user_metadata?.full_name || user.phone || user.email || "",
                avatar_url: user.user_metadata?.avatar_url || null,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: "id",
            });

        if (error) {
            console.error("Error upserting user profile:", error);
        } else {
            console.log("✅ User profile created/updated for:", user.phone || user.email);
        }
    } catch (error) {
        console.error("Error creating/updating user profile:", error);
    }
}
