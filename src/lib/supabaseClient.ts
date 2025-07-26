import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
}

// 🔧 SINGLETON PATTERN: Prevent multiple client instances
let supabaseInstance: SupabaseClient | null = null;

export const supabase = (() => {
    if (!supabaseInstance) {
        console.log("🚀 Creating new Supabase client instance");
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
    } else {
        console.log("♻️  Reusing existing Supabase client instance");
    }
    return supabaseInstance;
})();
