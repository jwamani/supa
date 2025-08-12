import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SupabaseConnection } from "./types";


const supabaseUrl= import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
}

// 🌐 QUICK CONNECTIVITY CHECK: Synchronous check for basic connectivity
const hasBasicConnectivity = (): boolean => {
    if (!navigator.onLine) {
        console.log("🔴 Browser reports offline - blocking client creation");
        return false;
    }
    console.log("🟢 Browser reports online - proceeding with client creation");
    return true;
};

// 🔧 SINGLETON PATTERN: Create client only if basic connectivity exists
let supabaseInstance: SupabaseClient | null = null;




export const supabase = (() => {
    if (!supabaseInstance) {
        try {
            if (!hasBasicConnectivity()) {
                throw new Error("❌ No internet connection detected. Please connect to the internet and refresh the page.");
            }
            console.log("🚀 Creating Supabase client instance");
            supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
                auth: {
                    // 🔑 STORAGE KEY: Use a unique key to avoid conflicts
                    storageKey: `supabase-auth-${import.meta.env.MODE}`,
                    // 🔄 AUTO REFRESH: Keep sessions fresh
                    autoRefreshToken: true,
                    // 💾 PERSIST SESSION: Remember user across browser sessions
                    persistSession: true,
                    // 🛡️ DETECT SESSION: Handle session changes
                    detectSessionInUrl: true,
                },
            });
            console.log("✅ Supabase client created successfully");
        } catch (error) {
            console.error("💥 Failed to create Supabase client:", error);
            throw new Error("Failed to initialize Supabase. Please check your internet connection and try again.");
        }
    } else {
        console.log("♻️ Reusing existing Supabase client instance");
    }

    // 🛡️ NULL SAFETY: Ensure we never return null
    if (!supabaseInstance) {
        throw new Error("❌ Supabase client initialization failed");
    }

    return supabaseInstance;
})();


export const checkInternetConnection = async (): Promise<boolean> => {
    try {
        if (!navigator.onLine) {
            console.log("🔴 Browser reports offline status");
            return false;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        await fetch("https://www.google.com/favicon.ico", {
            method: "HEAD",
            mode: "no-cors",
            cache: "no-cache",
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log("✅ Detailed internet connectivity verified");
        return true;
    } catch (error) {
        console.log("❌ Detailed connectivity check failed:", error);
        return false;
    }
};


export const supabaseConnectivity: SupabaseConnection = {
    async from(table: string) {
        const isConnected = await checkInternetConnection();
        if (!isConnected) {
            throw new Error("No Internet connection. Please check your network and try again");
        }
        return supabase.from(table);
    },
    async auth() {
        const isConnected = await checkInternetConnection();
        if (!isConnected) {
            throw new Error("No internet connection. Authentication require internet access");
        }
        return supabase.auth;
    },
    async isOnline() {
        return await checkInternetConnection();
    },
    async channel(name: string) {
        const isConnected = await checkInternetConnection();
        if (!isConnected) {
            console.warn("Creating channel while offline! Real-time features may not work");
        }
        return supabase.channel(name);
    },
}

// network event listeners
export const setupConnectivityMonitoring = (onStatusChange?: (isOnline: boolean) => void) => {
    const handleOnline = async () => {
        const actuallyOnline = await checkInternetConnection();
        console.log("🌐 Browser online event - Actual connectivity:", actuallyOnline);
        onStatusChange?.(actuallyOnline);
    }

    const handleOffline = () => {
        console.log("Browser offline event");
        onStatusChange?.(false);
    }

    // event listeners for connectivity changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
};