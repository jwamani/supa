import { useEffect, useState } from "react"
import { setupConnectivityMonitoring, supabaseConnectivity } from "../lib/supabaseClient";

export const useConnection = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isChecking, setIsChecking] = useState(false);


    useEffect(() => {
        const checkInitialConnectivity = async () => {
            setIsChecking(true);

            try {
                const actuallyOnline = await supabaseConnectivity.isOnline();
                setIsChecking(actuallyOnline);
            } catch (error) {
                console.error("Failed to check initial connectivity");
                setIsOnline(false);
            }
        }
        checkInitialConnectivity();

        const cleanup = setupConnectivityMonitoring((online) => setIsOnline(online));

        return cleanup;
    }, []);

    const refreshConnectivity = async () => {
        setIsChecking(true);
        try {
            const actuallyOnline = await supabaseConnectivity.isOnline();
            setIsOnline(actuallyOnline);
            return actuallyOnline;
        } catch (error) {
            console.error("Failed to refresh connectivity:", error);
            setIsOnline(false);
            return false;
        } finally {
            setIsChecking(false);
        }
    };

    return {
        isOnline,
        isChecking,
        refreshConnectivity
    }
}