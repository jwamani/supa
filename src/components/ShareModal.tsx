import React, { useState, useEffect } from 'react';
import { useCollaboration } from '../hooks/useCollaboration';
import { Globe, Mail, Users, Copy, X, Plus, Trash2 } from 'lucide-react';
import type { Database } from '../lib/types';

interface ShareModalProps {
    documentId: string;
    isOpen: boolean;
    onClose: () => void;
    document?: Database["public"]["Tables"]["documents"]["Row"];
}

type ROLES = 'editor' | 'commenter' | 'viewer';
type Permission = Database["public"]["Tables"]["document_permissions"]["Row"] & {
    profiles?: {
        id: string;
        email: string;
        full_name: string;
        avatar_url?: string;
    };
};

export const ShareModal: React.FC<ShareModalProps> = ({
    documentId,
    isOpen,
    onClose,
    document
}) => {
    // 🎓 LEARNING: Tab-based UI state management
    // This demonstrates how to create a multi-tab interface for better UX
    const [activeTab, setActiveTab] = useState<'invite' | 'public'>('invite');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<ROLES>('viewer');
    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [publicLinkCopied, setPublicLinkCopied] = useState(false);

    const {
        addCollaborator,
        fetchPermissions,
        removeCollaborator
    } = useCollaboration();

    // 🎓 LEARNING: Load permissions when modal opens
    // This demonstrates proper data loading patterns for modals
    useEffect(() => {
        if (isOpen && documentId) {
            loadPermissions();
        }
    }, [isOpen, documentId]);

    const loadPermissions = async () => {
        try {
            console.log('📋 Loading permissions for document:', documentId);
            const data = await fetchPermissions(documentId);
            setPermissions(data);
            console.log('✅ Permissions loaded:', data.length, 'collaborators');
        } catch (error) {
            console.error('❌ Failed to load permissions:', error);
        }
    };

    // 🎓 LEARNING: Enhanced collaborator invitation with feedback
    // This demonstrates proper form handling and user feedback
    const handleAddCollaborator = async () => {
        if (!email.trim()) return;

        setLoading(true);
        try {
            console.log('👥 Adding collaborator:', { email, role, documentId });
            const result = await addCollaborator(email, documentId, role);
            if (result.success) {
                console.log('✅ Collaborator added successfully');
                setEmail('');
                await loadPermissions(); // Refresh the list
            } else {
                console.error("❌ Failed to add collaborator:", result.error);
            }
        } catch (error) {
            console.error("❌ Error adding collaborator:", error);
        } finally {
            setLoading(false);
        }
    };

    // 🎓 LEARNING: Remove collaborator with immediate UI feedback
    // This demonstrates optimistic updates and error handling
    const handleRemoveCollaborator = async (userEmail: string) => {
        try {
            console.log('🗑️ Removing collaborator:', userEmail);
            const result = await removeCollaborator(documentId, userEmail);
            if (result.success) {
                console.log('✅ Collaborator removed successfully');
                await loadPermissions(); // Refresh the list
            }
        } catch (error) {
            console.error('❌ Failed to remove collaborator:', error);
        }
    };

    // 🎓 LEARNING: Copy to clipboard with user feedback
    // This demonstrates browser APIs and temporary state management
    const copyPublicLink = async () => {
        const link = `${window.location.origin}/public/${document?.public_slug || documentId}`;
        try {
            await navigator.clipboard.writeText(link);
            setPublicLinkCopied(true);
            console.log('📋 Public link copied to clipboard');
            setTimeout(() => setPublicLinkCopied(false), 2000);
        } catch (error) {
            console.error('❌ Failed to copy link:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
                {/* 🎓 LEARNING: Modal Header with document context */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Share Document</h2>
                        <p className="text-sm text-gray-600 mt-1">"{document?.title || 'Untitled Document'}"</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        title="Close modal"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* 🎓 LEARNING: Tab navigation for complex modals */}
                {/* This demonstrates how to organize multiple features in one modal */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('invite')}
                        className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'invite'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Mail className="h-4 w-4 inline mr-2" />
                        Invite People
                    </button>
                    <button
                        onClick={() => setActiveTab('public')}
                        className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'public'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Globe className="h-4 w-4 inline mr-2" />
                        Public Link
                    </button>
                </div>

                {/* 🎓 LEARNING: Conditional content rendering based on active tab */}
                <div className="p-6 max-h-96 overflow-y-auto">
                    {activeTab === 'invite' ? (
                        <div className="space-y-6">
                            {/* 🎓 LEARNING: Collaborator invitation form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter collaborator email"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role
                                    </label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as ROLES)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="viewer">Viewer - Can only read</option>
                                        <option value="commenter">Commenter - Can read and comment</option>
                                        <option value="editor">Editor - Can read, edit, and comment</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleAddCollaborator}
                                    disabled={loading || !email.trim()}
                                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Adding...
                                        </div>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 inline mr-2" />
                                            Add Collaborator
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 🎓 LEARNING: Dynamic collaborators list with management actions */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                    <Users className="h-4 w-4 mr-2" />
                                    Collaborators ({permissions.length})
                                </h3>

                                <div className="space-y-2">
                                    {permissions.map((permission) => (
                                        <div key={permission.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                                            <div className="flex items-center space-x-3">
                                                {/* 🎓 LEARNING: Avatar generation from user data */}
                                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                    {permission.profiles?.full_name?.[0] || permission.profiles?.email?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {permission.profiles?.full_name || permission.profiles?.email}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {permission.profiles?.email}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full capitalize">
                                                    {permission.role}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveCollaborator(permission.profiles?.email || '')}
                                                    className="text-gray-400 hover:text-red-600 p-1"
                                                    title="Remove collaborator"
                                                    disabled={!permission.profiles?.email}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* 🎓 LEARNING: Empty state handling */}
                                    {permissions.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">No collaborators yet</p>
                                            <p className="text-xs">Add people to collaborate on this document</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* 🎓 LEARNING: Public access toggle (placeholder for future integration) */}
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                                <div className="flex items-center space-x-3">
                                    <Globe className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Public Access</div>
                                        <div className="text-xs text-gray-500">Anyone with the link can view</div>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={document?.is_public || false}
                                        onChange={async (e) => {
                                            // 🎓 LEARNING: Placeholder for public toggle integration
                                            console.log('🔄 Toggle public access:', e.target.checked);
                                            // TODO: Integrate with updateDocument function when available
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* 🎓 LEARNING: Conditional public link display */}
                            {document?.is_public && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Public Link
                                    </label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            value={`${window.location.origin}/public/${document?.public_slug || documentId}`}
                                            readOnly
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                                        />
                                        <button
                                            onClick={copyPublicLink}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 text-sm"
                                        >
                                            {publicLinkCopied ? (
                                                <span className="text-green-200">Copied!</span>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4 inline mr-1" />
                                                    Copy
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 🎓 LEARNING: Empty state for private documents */}
                            {!document?.is_public && (
                                <div className="text-center py-8 text-gray-500">
                                    <Globe className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">Document is private</p>
                                    <p className="text-xs">Enable public access to share with anyone</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 🎓 LEARNING: Modal footer with consistent actions */}
                <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
