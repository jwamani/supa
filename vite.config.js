import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    css: {
        postcss: "./postcss.config.mjs",
    },
    server: {
        watch: {
            usePolling: true,
        },
    },
    build: {
        // Increase the warning limit to reduce noise during development
        chunkSizeWarningLimit: 1000,
        // Implement code splitting for better performance
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split vendor dependencies into their own chunks
                    "vendor-react": ["react", "react-dom", "react-router-dom"],
                    "vendor-supabase": ["@supabase/supabase-js"],
                    "vendor-ui": ["lucide-react"],
                    // Add more vendor chunks as needed
                },
            },
        },
        // Enable source maps for debugging production build
        sourcemap: true,
    },
});
