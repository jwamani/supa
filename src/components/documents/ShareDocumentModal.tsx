// 🎓 LEARNING: Document Sharing Component
// This component demonstrates collaborative features with role-based permissions

import React, { useState, useEffect } from 'react';
import { X, Plus, Copy, Check, Users, Crown, Edit, Eye, UserX, Mail } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Badge from '../ui/Badge';

// 🎓 LEARNING: Permission levels for document collaboration
export type PermissionLevel = 'owner' | 'editor' | 'viewer';

// 🎓 LEARNING: Document share configuration
export interface DocumentShare {
    id: string;
    user_email: string;
    user_name?: string;
    permission: PermissionLevel;
    created_at: string;
}

export interface ShareDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string;
    documentTitle: string;
    currentShares?: DocumentShare[];
    onShare?: (email: string, permission: PermissionLevel) => Promise<void>;
    onUpdatePermission?: (shareId: string, permission: PermissionLevel) => Promise<void>;
    onRemoveShare?: (shareId: string) => Promise<void>;
}

const ShareDocumentModal: React.FC<ShareDocumentModalProps> = React.memo(({
    isOpen,
    onClose,
    documentId,
    documentTitle,
    currentShares = [],
    onShare,
    onUpdatePermission,
    onRemoveShare
}) => {
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState<PermissionLevel>('viewer');
    const [isSharing, setIsSharing] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 🎓 LEARNING: Reset form when modal opens/closes
    React.useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setPermission('viewer');
            setError(null);
            setCopySuccess(false);
        }
    }, [isOpen]);
    if (!documentId || !documentTitle) {
        return null;
    }

    // 🎓 LEARNING: Generate shareable link for the document
    const shareableLink = React.useMemo(() =>
        `${window.location.origin}/document/${documentId}`,
        [documentId]
    );

    // 🎓 LEARNING: Copy link to clipboard functionality
    const handleCopyLink = React.useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareableLink);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    }, [shareableLink]);

    // 🎓 LEARNING: Share document with user via email
    const handleShare = React.useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !onShare) return;

        setIsSharing(true);
        setError(null);

        try {
            await onShare(email.trim(), permission);
            setEmail('');
            setPermission('viewer');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to share document');
        } finally {
            setIsSharing(false);
        }
    }, [email, permission, onShare]);

    // 🎓 LEARNING: Update permission level for existing share
    const handleUpdatePermission = React.useCallback(async (shareId: string, newPermission: PermissionLevel) => {
        if (!onUpdatePermission) return;

        try {
            await onUpdatePermission(shareId, newPermission);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update permission');
        }
    }, [onUpdatePermission]);

    // 🎓 LEARNING: Remove user access to document
    const handleRemoveShare = React.useCallback(async (shareId: string) => {
        if (!onRemoveShare) return;

        try {
            await onRemoveShare(shareId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove access');
        }
    }, [onRemoveShare]);

    // 🎓 LEARNING: Permission level styling and icons
    const getPermissionIcon = React.useCallback((permission: PermissionLevel) => {
        switch (permission) {
            case 'owner': return <Crown className="w-4 h-4" />;
            case 'editor': return <Edit className="w-4 h-4" />;
            case 'viewer': return <Eye className="w-4 h-4" />;
            default: return <Eye className="w-4 h-4" />;
        }
    }, []);

    const getPermissionColor = React.useCallback((permission: PermissionLevel) => {
        switch (permission) {
            case 'owner': return 'bg-yellow-100 text-yellow-800';
            case 'editor': return 'bg-green-100 text-green-800';
            case 'viewer': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }, []);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Share Document">
            <div className="space-y-6">
                {/* Document Title */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Sharing: {documentTitle}
                    </h3>
                    <p className="text-sm text-gray-600">
                        Invite others to collaborate on this document
                    </p>
                </div>

                {/* Share Link Section */}
                <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Share Link</span>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={shareableLink}
                            readOnly
                            className="flex-1 bg-white"
                        />
                        <Button
                            onClick={handleCopyLink}
                            variant="outline"
                            className="px-3"
                        >
                            {copySuccess ? (
                                <Check className="w-4 h-4 text-green-600" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                    {copySuccess && (
                        <p className="text-sm text-green-600 mt-2">Link copied to clipboard!</p>
                    )}
                </div>

                {/* Invite User Form */}
                <form onSubmit={handleShare} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Invite by Email</span>
                    </div>
                    <div className="space-y-3">
                        <Input
                            type="email"
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <div className="flex gap-3">
                            <select
                                value={permission}
                                onChange={(e) => setPermission(e.target.value as PermissionLevel)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="viewer">Viewer - Can view only</option>
                                <option value="editor">Editor - Can view and edit</option>
                            </select>
                            <Button
                                type="submit"
                                disabled={!email.trim() || isSharing}
                                className="flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                {isSharing ? 'Sharing...' : 'Share'}
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Current Shares List */}
                {currentShares.length > 0 && (
                    <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Users className="w-5 h-5 text-gray-600" />
                            <span className="font-medium text-gray-900">
                                People with access ({currentShares.length})
                            </span>
                        </div>
                        <div className="space-y-3">
                            {currentShares.map((share) => (
                                <div key={share.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium text-gray-600">
                                                {share.user_name?.[0] || share.user_email[0].toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {share.user_name || share.user_email}
                                            </p>
                                            {share.user_name && (
                                                <p className="text-sm text-gray-600">{share.user_email}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant="default"
                                            className={`flex items-center gap-1 ${getPermissionColor(share.permission)}`}
                                        >
                                            {getPermissionIcon(share.permission)}
                                            {share.permission}
                                        </Badge>
                                        {share.permission !== 'owner' && (
                                            <div className="flex gap-1">
                                                {share.permission !== 'viewer' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleUpdatePermission(share.id, 'viewer')}
                                                        className="px-2 py-1 text-xs"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                    </Button>
                                                )}
                                                {share.permission !== 'editor' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleUpdatePermission(share.id, 'editor')}
                                                        className="px-2 py-1 text-xs"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRemoveShare(share.id)}
                                                    className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                                                >
                                                    <UserX className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Done
                    </Button>
                </div>
            </div>
        </Modal>
    );
});

ShareDocumentModal.displayName = 'ShareDocumentModal';

export default ShareDocumentModal;
