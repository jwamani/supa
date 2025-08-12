import React from 'react';
import { useConnection } from '../hooks/useConnection';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const Connectivity: React.FC = () => {
    const { isOnline, isChecking, refreshConnectivity } = useConnection();

    // 🎨 CONDITIONAL STYLING: Different styles based on connectivity
    const statusStyles = {
        online: {
            backgroundColor: '#d4edda',
            color: '#155724',
            borderColor: '#c3e6cb'
        },
        offline: {
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderColor: '#f5c6cb'
        },
        checking: {
            backgroundColor: '#fff3cd',
            color: '#856404',
            borderColor: '#ffeaa7'
        }
    };

    const getStatusStyle = () => {
        if (isChecking) return statusStyles.checking;
        return isOnline ? statusStyles.online : statusStyles.offline;
    };

    const getStatusText = () => {
        if (isChecking) return 'Checking connection...';
        return isOnline ? 'Connected to internet' : 'No internet connection';
    };

    const getStatusIcon = () => {
        if (isChecking) return <RefreshCw className="w-4 h-4 animate-spin" />;
        return isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />;
    };

    return (
        <div
            style={{
                ...getStatusStyle(),
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500'
            }}
        >
            {getStatusIcon()}
            <span>{getStatusText()}</span>

            {/* 🔄 REFRESH BUTTON: Allow manual connectivity check */}
            {!isChecking && (
                <button
                    onClick={refreshConnectivity}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: '2px',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0.7
                    }}
                    title="Refresh connection status"
                >
                    <RefreshCw className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}
