// 🎓 LEARNING: Editor Status Indicators Component
// This component shows document status, word count, and collaboration info

import React from 'react';
import {
    Save,
    Wifi,
    WifiOff,
    Users,
    Clock,
    FileText,
    AlertCircle,
    CheckCircle,
    Loader
} from 'lucide-react';
import Badge from '../ui/Badge';

export interface EditorStatusProps {
    // Document status
    isSaving?: boolean;
    lastSaved?: Date | null;
    isOnline?: boolean;
    hasUnsavedChanges?: boolean;

    // Document statistics
    wordCount?: number;
    charCount?: number;
    minutes_read?: number;

    // Collaboration info
    activeUsers?: {
        id: string;
        name: string;
        color?: string;
    }[];

    // Error state
    saveError?: string | null;

    className?: string;
}

const EditorStatus: React.FC<EditorStatusProps> = ({
    isSaving = false,
    lastSaved,
    isOnline = true,
    hasUnsavedChanges = false,
    wordCount = 0,
    charCount = 0,
    minutes_read = 0,
    activeUsers = [],
    saveError = null,
    className = ''
}) => {
    // 🎓 LEARNING: Format last saved time for display
    const formatLastSaved = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'Just now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) { // 24 hours
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    // 🎓 LEARNING: Get status indicator based on current state
    const getStatusIndicator = () => {
        if (saveError) {
            return {
                icon: <AlertCircle className="w-4 h-4" />,
                text: 'Error saving',
                color: 'text-red-600',
                bgColor: 'bg-red-50'
            };
        }

        if (isSaving) {
            return {
                icon: <Loader className="w-4 h-4 animate-spin" />,
                text: 'Saving...',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50'
            };
        }

        if (hasUnsavedChanges) {
            return {
                icon: <Save className="w-4 h-4" />,
                text: 'Unsaved changes',
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-50'
            };
        }

        return {
            icon: <CheckCircle className="w-4 h-4" />,
            text: 'All changes saved',
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        };
    };

    const statusInfo = getStatusIndicator();

    return (
        <div className={`flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm ${className}`}>
            {/* Left Section: Save Status and Connection */}
            <div className="flex items-center gap-4">
                {/* Save Status */}
                <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${statusInfo.bgColor}`}>
                    <span className={statusInfo.color}>{statusInfo.icon}</span>
                    <span className={`font-medium ${statusInfo.color}`}>
                        {statusInfo.text}
                    </span>
                    {saveError && (
                        <span className="text-red-600 ml-1" title={saveError}>
                            - Click to retry
                        </span>
                    )}
                </div>

                {/* Last Saved */}
                {lastSaved && !isSaving && (
                    <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>Last saved {formatLastSaved(lastSaved)}</span>
                    </div>
                )}

                {/* Connection Status */}
                <div className="flex items-center gap-1">
                    {isOnline ? (
                        <div className="flex items-center gap-1 text-green-600">
                            <Wifi className="w-4 h-4" />
                            <span className="hidden sm:inline">Online</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-red-600">
                            <WifiOff className="w-4 h-4" />
                            <span className="hidden sm:inline">Offline</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Center Section: Document Stats */}
            <div className="hidden md:flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{wordCount.toLocaleString()} words</span>
                </div>
                <div className="text-gray-400">|</div>
                <div>
                    <span>{charCount.toLocaleString()} characters</span>
                </div>
                <div className="text-gray-400">|</div>
                <div>
                    <span>{minutes_read.toLocaleString()} min read</span>
                </div>
            </div>

            {/* Right Section: Collaboration */}
            <div className="flex items-center gap-3">
                {/* Active Users */}
                {activeUsers.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-600" />
                        <div className="flex -space-x-2">
                            {activeUsers.slice(0, 3).map((user, index) => (
                                <div
                                    key={user.id}
                                    className={`
                    w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white
                    ${user.color || 'bg-blue-500'}
                  `}
                                    title={user.name}
                                    style={{ backgroundColor: user.color || '#3b82f6' }}
                                >
                                    {user.name[0].toUpperCase()}
                                </div>
                            ))}
                            {activeUsers.length > 3 && (
                                <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs font-medium text-white">
                                    +{activeUsers.length - 3}
                                </div>
                            )}
                        </div>
                        <span className="hidden sm:inline text-gray-600">
                            {activeUsers.length} editing
                        </span>
                    </div>
                )}

                {/* Collaboration Status Badge */}
                {activeUsers.length > 0 && (
                    <Badge variant="info" className="hidden lg:flex">
                        Live collaboration
                    </Badge>
                )}
            </div>
        </div>
    );
};

export default EditorStatus;
