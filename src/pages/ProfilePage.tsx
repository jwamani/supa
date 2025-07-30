import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProfile } from '../hooks/useProfile';
import {
    ArrowLeft,
    User,
    Mail,
    Calendar,
    Edit2,
    Save,
    X,
    Camera,
    Shield,
    Bell,
    Key,
    Loader2,
    AlertCircle
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
    const { user, signOut } = useAuthStore();
    const { profile, loading, error, updateProfile } = useProfile();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        username: '',
        preferences: {
            notifications: {
                email: true,
                mentions: true,
                comments: true,
                shares: true
            },
            editor: {
                auto_save: true,
                spell_check: true,
                word_wrap: true
            }
        }
    });

    // Update form data when profile loads
    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                bio: profile.bio || '',
                username: profile.username || '',
                preferences: {
                    notifications: {
                        email: profile.preferences?.notifications?.email ?? true,
                        mentions: profile.preferences?.notifications?.mentions ?? true,
                        comments: profile.preferences?.notifications?.comments ?? true,
                        shares: profile.preferences?.notifications?.shares ?? true
                    },
                    editor: {
                        auto_save: profile.preferences?.editor?.auto_save ?? true,
                        spell_check: profile.preferences?.editor?.spell_check ?? true,
                        word_wrap: profile.preferences?.editor?.word_wrap ?? true
                    }
                }
            });
        }
    }, [profile]);

    const handleSave = async () => {
        if (!profile) return;

        try {
            setIsSaving(true);
            setSaveError(null);

            await updateProfile({
                full_name: formData.full_name,
                bio: formData.bio,
                username: formData.username,
                preferences: formData.preferences
            });

            setIsEditing(false);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to save profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                bio: profile.bio || '',
                username: profile.username || '',
                preferences: {
                    notifications: {
                        email: profile.preferences?.notifications?.email ?? true,
                        mentions: profile.preferences?.notifications?.mentions ?? true,
                        comments: profile.preferences?.notifications?.comments ?? true,
                        shares: profile.preferences?.notifications?.shares ?? true
                    },
                    editor: {
                        auto_save: profile.preferences?.editor?.auto_save ?? true,
                        spell_check: profile.preferences?.editor?.spell_check ?? true,
                        word_wrap: profile.preferences?.editor?.word_wrap ?? true
                    }
                }
            });
        }
        setIsEditing(false);
        setSaveError(null);
    };

    const updatePreference = (category: 'notifications' | 'editor', key: string, value: boolean) => {
        setFormData(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                [category]: {
                    ...prev.preferences[category],
                    [key]: value
                }
            }
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading profile...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
                    <p className="text-gray-600 mb-4">Unable to load your profile information.</p>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/dashboard"
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <h1 className="text-xl font-semibold text-gray-900">Profile Settings</h1>
                        </div>

                        <div className="flex items-center space-x-2">
                            {saveError && (
                                <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{saveError}</span>
                                </div>
                            )}

                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg text-sm disabled:opacity-50"
                                    >
                                        <X className="h-4 w-4 mr-1 inline" />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 flex items-center"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4 mr-1" />
                                        )}
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                >
                                    <Edit2 className="h-4 w-4 mr-1 inline" />
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            {/* Avatar */}
                            <div className="text-center mb-6">
                                <div className="relative inline-block">
                                    <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                        {formData.full_name
                                            ? formData.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                                            : profile.email?.[0].toUpperCase()
                                        }
                                    </div>
                                    {isEditing && (
                                        <button className="absolute bottom-0 right-0 bg-gray-600 text-white p-2 rounded-full hover:bg-gray-700">
                                            <Camera className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>

                                <h2 className="text-xl font-semibold text-gray-900 mt-4">
                                    {formData.full_name || 'Unnamed User'}
                                </h2>
                                <p className="text-gray-600">{profile.email}</p>
                                {formData.username && (
                                    <p className="text-sm text-gray-500">@{formData.username}</p>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="border-t pt-6">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">12</div>
                                        <div className="text-sm text-gray-600">Documents</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">5</div>
                                        <div className="text-sm text-gray-600">Collaborations</div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Info */}
                            <div className="border-t pt-6 mt-6">
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center text-gray-600">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Joined {new Date(profile.created_at || '').toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Shield className="h-4 w-4 mr-2" />
                                        Email verified
                                    </div>
                                    {profile.last_active_at && (
                                        <div className="flex items-center text-gray-600">
                                            <User className="h-4 w-4 mr-2" />
                                            Last active {new Date(profile.last_active_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings Panels */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Information */}
                        <div className="bg-white rounded-lg shadow-sm border">
                            <div className="p-6 border-b">
                                <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                                <p className="text-sm text-gray-600">Update your personal details and how others see you.</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter your full name"
                                            />
                                        ) : (
                                            <div className="flex items-center py-2">
                                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                                <span className="text-gray-900">{formData.full_name || 'Not set'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Username
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Choose a username"
                                            />
                                        ) : (
                                            <div className="flex items-center py-2">
                                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                                <span className="text-gray-900">
                                                    {formData.username ? `@${formData.username}` : 'Not set'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <div className="flex items-center py-2">
                                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-gray-900">{profile.email}</span>
                                        <span className="ml-2 text-xs text-gray-500">(Cannot be changed)</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bio
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                            rows={3}
                                            maxLength={500}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Tell others about yourself..."
                                        />
                                    ) : (
                                        <div className="py-2 text-gray-900">
                                            {formData.bio || 'No bio added yet.'}
                                        </div>
                                    )}
                                    {isEditing && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {formData.bio.length}/500 characters
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="bg-white rounded-lg shadow-sm border">
                            <div className="p-6 border-b">
                                <h3 className="text-lg font-medium text-gray-900">Preferences</h3>
                                <p className="text-sm text-gray-600">Customize your DocCollab experience.</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Bell className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <div className="font-medium text-gray-900">Email Notifications</div>
                                            <div className="text-sm text-gray-600">Receive email updates about your documents</div>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.preferences.notifications.email}
                                            onChange={(e) => updatePreference('notifications', 'email', e.target.checked)}
                                            disabled={!isEditing}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Bell className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <div className="font-medium text-gray-900">Mention Notifications</div>
                                            <div className="text-sm text-gray-600">Get notified when someone mentions you</div>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.preferences.notifications.mentions}
                                            onChange={(e) => updatePreference('notifications', 'mentions', e.target.checked)}
                                            disabled={!isEditing}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Bell className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <div className="font-medium text-gray-900">Comments Notifications</div>
                                            <div className="text-sm text-gray-600">Get notified about new comments</div>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.preferences.notifications.comments}
                                            onChange={(e) => updatePreference('notifications', 'comments', e.target.checked)}
                                            disabled={!isEditing}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Bell className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <div className="font-medium text-gray-900">Share Notifications</div>
                                            <div className="text-sm text-gray-600">Get notified when documents are shared with you</div>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.preferences.notifications.shares}
                                            onChange={(e) => updatePreference('notifications', 'shares', e.target.checked)}
                                            disabled={!isEditing}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                                    </label>
                                </div>

                                <hr className="my-6" />

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Edit2 className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <div className="font-medium text-gray-900">Auto Save</div>
                                            <div className="text-sm text-gray-600">Automatically save document changes</div>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.preferences.editor.auto_save}
                                            onChange={(e) => updatePreference('editor', 'auto_save', e.target.checked)}
                                            disabled={!isEditing}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Edit2 className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <div className="font-medium text-gray-900">Spell Check</div>
                                            <div className="text-sm text-gray-600">Check spelling while typing</div>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.preferences.editor.spell_check}
                                            onChange={(e) => updatePreference('editor', 'spell_check', e.target.checked)}
                                            disabled={!isEditing}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Edit2 className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <div className="font-medium text-gray-900">Word Wrap</div>
                                            <div className="text-sm text-gray-600">Wrap long lines in the editor</div>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.preferences.editor.word_wrap}
                                            onChange={(e) => updatePreference('editor', 'word_wrap', e.target.checked)}
                                            disabled={!isEditing}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="flex items-center">
                                        <Key className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                                            <div className="text-sm text-gray-600">Add an extra layer of security to your account</div>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                                        Enable
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-white rounded-lg shadow-sm border border-red-200">
                            <div className="p-6 border-b border-red-200">
                                <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
                                <p className="text-sm text-red-600">Irreversible and destructive actions.</p>
                            </div>

                            <div className="p-6">
                                <button
                                    onClick={signOut}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
