import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useDocuments } from '../hooks/useDocuments';
import type { Database } from '../lib/types';

import {
    FileText,
    Plus,
    Search,
    Filter,
    Grid3X3,
    List,
    User,
    Settings,
    LogOut,
    RefreshCw,
    X,
    MoreVertical,
    Trash2,
    Edit,
    Share2,
    Globe,
    Eye,
    Lock,
    CheckCircle,
    Clock,
    Archive
} from 'lucide-react';

type ViewMode = "grid" | "list";
type Document = Database["public"]["Tables"]["documents"]["Row"]

export const DashboardPage: React.FC = () => {
    const { user, signOut } = useAuthStore();
    const { documents, loading, error, createDocument, refetch, forceRefresh, deleteDocument, searchDocuments, updateDocument } = useDocuments();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchMode, setSearchMode] = useState<'normal' | 'search'>('normal');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newDocTitle, setNewDocTitle] = useState('');
    const [creating, setCreating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; document: Document | null }>({
        isOpen: false,
        document: null
    });
    const [deleting, setDeleting] = useState(false);
    const [shareModal, setShareModal] = useState<{ isOpen: boolean; document: Document | null }>({
        isOpen: false,
        document: null
    });
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    // Debug effect to track shareModal changes
    useEffect(() => {
        if (shareModal.document) {
            console.log('🔄 ShareModal document updated:', {
                id: shareModal.document.id,
                title: shareModal.document.title,
                is_public: shareModal.document.is_public
            });
        }
    }, [shareModal.document?.is_public, shareModal.document?.id]);

    const handleSignOut = async () => {
        await signOut();
    };

    // Get status display information
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'published':
                return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Published' };
            case 'draft':
                return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Draft' };
            case 'archived':
                return { icon: Archive, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Archived' };
            default:
                return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Draft' };
        }
    };

    // Toggle document status between draft and published
    const handleStatusToggle = async (doc: any) => {
        const newStatus = doc.status === 'published' ? 'draft' : 'published';
        try {
            setUpdatingStatus(doc.id);
            await updateDocument(doc.id, { status: newStatus });
        } catch (err) {
            console.error('Error updating document status:', err);
        } finally {
            setUpdatingStatus(null);
        }
    };

    // Open sharing modal - get the latest document state
    const handleShareDocument = (doc: Document) => {
        // Find the current document from the documents array to ensure we have the latest state
        const currentDoc = documents.find(d => d.id === doc.id) || doc;
        setShareModal({ isOpen: true, document: currentDoc });
    };


    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await refetch(true); // Force refresh
        } catch (err) {
            console.error('Error refreshing documents:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const handleCreateDocument = async () => {
        if (!newDocTitle.trim()) return;

        try {
            setCreating(true);
            const doc = await createDocument(newDocTitle);
            setNewDocTitle('');
            setShowCreateModal(false);
            navigate(`/document/${doc.id}`);
        } catch (err) {
            console.error('Error creating document:', err);
        } finally {
            setCreating(false);
        }
    };    // Server-side search functionality
    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (!query.trim()) {
            setSearchMode('normal');
            setSearchResults([]);
            return;
        }

        try {
            setSearchMode('search');

            if (user?.id) {
                const results = await searchDocuments(query.trim());
                setSearchResults(results);
                console.log(`🔍 Search: Found ${results.length} results for "${query}"`);
            }
        } catch (err) {
            console.error('Search error:', err);
            setSearchResults([]);
        }
    };

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleSearch(searchQuery);
        }, 150); // Reduced from 300ms to 150ms for faster response

        return () => clearTimeout(timeoutId);
    }, [searchQuery, user?.id]);

    const handleDeleteDocument = async () => {
        if (!deleteModal.document) return;

        try {
            setDeleting(true);
            await deleteDocument(deleteModal.document.id);
            setDeleteModal({ isOpen: false, document: null });
        } catch (err) {
            console.error('Error deleting document:', err);
        } finally {
            setDeleting(false);
        }
    };

    const openDeleteModal = (document: any) => {
        setDeleteModal({ isOpen: true, document });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, document: null });
    };

    // Determine which documents to display
    const displayDocuments = searchMode === 'search' ? searchResults : documents;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">Error: {error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        {/* Logo and Brand */}
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-xl font-semibold text-gray-900">DocCollab</h1>
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <User className="h-4 w-4" />
                                <span>{user?.user_metadata?.full_name || user?.email}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Link
                                    to="/profile"
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                    title="Profile Settings"
                                >
                                    <Settings className="h-5 w-5" />
                                </Link>

                                <button
                                    onClick={handleSignOut}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                    title="Sign out"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Documents</h2>
                        <p className="text-gray-600">Manage and collaborate on your documents</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Document
                        </button>

                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                            title="Refresh documents"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSearchMode('normal');
                                        setSearchResults([]);
                                    }}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md ${viewMode === 'grid'
                                    ? 'bg-white shadow text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md ${viewMode === 'list'
                                    ? 'bg-white shadow text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Filter */}
                        <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </button>
                    </div>
                </div>

                {/* Search Results Indicator */}
                {searchMode === 'search' && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Search className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-blue-700">
                                    Found {displayDocuments.length} result{displayDocuments.length !== 1 ? 's' : ''} for "{searchQuery}"
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSearchMode('normal');
                                    setSearchResults([]);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                Clear search
                            </button>
                        </div>
                    </div>
                )}

                {/* Documents Grid/List */}
                {viewMode === 'grid' ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {displayDocuments.map((doc) => {
                            const statusInfo = getStatusInfo(doc.status);
                            const StatusIcon = statusInfo.icon;
                            return (
                                <div key={doc.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow group">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="bg-blue-100 p-2 rounded-lg">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {/* Status indicator */}
                                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    <span>{statusInfo.label}</span>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                                                    {/* Share button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleShareDocument(doc);
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Share document"
                                                    >
                                                        <Share2 className="h-4 w-4" />
                                                    </button>
                                                    {/* Delete button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDeleteModal(doc);
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete document"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                            {doc.title}
                                        </h3>

                                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                            {doc.content_text || 'No content yet'}
                                        </p>

                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <span>{doc.word_count} words</span>
                                            <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            {/* Status toggle button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusToggle(doc);
                                                }}
                                                disabled={updatingStatus === doc.id}
                                                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${doc.status === 'published'
                                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    } disabled:opacity-50`}
                                            >
                                                {updatingStatus === doc.id ? 'Updating...' : (
                                                    doc.status === 'published' ? 'Make Draft' : 'Publish'
                                                )}
                                            </button>

                                            <button
                                                onClick={() => navigate(`/document/${doc.id}`)}
                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                            >
                                                Open →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Document
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Word Count
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Last Modified
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {displayDocuments.map((doc) => {
                                        const statusInfo = getStatusInfo(doc.status);
                                        const StatusIcon = statusInfo.icon;
                                        return (
                                            <tr key={doc.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                                            <FileText className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {doc.title}
                                                            </div>
                                                            <div className="text-sm text-gray-500 truncate max-w-xs">
                                                                {doc.content_text || 'No content yet'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${statusInfo.bg} ${statusInfo.color}`}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        <span>{statusInfo.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {doc.word_count} words
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {new Date(doc.updated_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        {/* Status toggle */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStatusToggle(doc);
                                                            }}
                                                            disabled={updatingStatus === doc.id}
                                                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${doc.status === 'published'
                                                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                } disabled:opacity-50`}
                                                        >
                                                            {updatingStatus === doc.id ? '...' : (
                                                                doc.status === 'published' ? 'Draft' : 'Publish'
                                                            )}
                                                        </button>

                                                        {/* Share */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleShareDocument(doc);
                                                            }}
                                                            className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                                                            title="Share document"
                                                        >
                                                            <Share2 className="h-4 w-4" />
                                                        </button>

                                                        {/* Open */}
                                                        <button
                                                            onClick={() => navigate(`/document/${doc.id}`)}
                                                            className="text-blue-600 hover:text-blue-700 font-medium"
                                                        >
                                                            Open
                                                        </button>

                                                        {/* Delete */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openDeleteModal(doc);
                                                            }}
                                                            className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                                            title="Delete document"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {displayDocuments.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchQuery ? 'No documents found' : 'No documents yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery
                                ? `No documents match "${searchQuery}"`
                                : 'Get started by creating your first document.'
                            }
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Document
                            </button>
                        )}
                    </div>
                )}
            </main>

            {/* Create Document Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Document</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Document Title
                            </label>
                            <input
                                type="text"
                                value={newDocTitle}
                                onChange={(e) => setNewDocTitle(e.target.value)}
                                placeholder="Enter document title..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewDocTitle('');
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                disabled={creating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateDocument}
                                disabled={creating || !newDocTitle.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Document Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center mb-4">
                            <div className="bg-red-100 p-2 rounded-lg mr-3">
                                <Trash2 className="h-5 w-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Delete Document</h3>
                        </div>

                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>"{deleteModal.document?.title}"</strong>?
                            This action cannot be undone.
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={closeDeleteModal}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteDocument}
                                disabled={deleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Document Modal */}
            {shareModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                    <Share2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Share Document</h3>
                            </div>
                            <button
                                onClick={() => setShareModal({ isOpen: false, document: null })}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-2">"{shareModal.document?.title}"</h4>
                            <p className="text-sm text-gray-600">
                                Share this document with others and manage their permissions.
                            </p>
                        </div>

                        {/* Public sharing toggle */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Globe className="h-5 w-5 text-gray-600 mr-3" />
                                    <div>
                                        <div className="font-medium text-gray-900">Public Access</div>
                                        <div className="text-sm text-gray-600">Anyone with the link can view</div>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={shareModal.document?.is_public || false}
                                        onChange={async (e) => {
                                            if (shareModal.document) {
                                                const newValue = e.target.checked;
                                                console.log('🔄 Toggle clicked:', {
                                                    documentId: shareModal.document.id,
                                                    currentValue: shareModal.document.is_public,
                                                    newValue: newValue
                                                });

                                                try {
                                                    const updatedDoc = await updateDocument(shareModal.document.id, {
                                                        is_public: newValue
                                                    });

                                                    console.log('✅ Document updated successfully:', {
                                                        id: updatedDoc.id,
                                                        is_public: updatedDoc.is_public
                                                    });

                                                    // Update the modal state to reflect the change using the returned data
                                                    setShareModal({
                                                        ...shareModal,
                                                        document: updatedDoc
                                                    });
                                                } catch (err) {
                                                    console.error('❌ Error updating public status:', err);
                                                }
                                            }
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${shareModal.document?.is_public ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}>
                                        <div className={`absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-200 ease-in-out ${shareModal.document?.is_public ? 'translate-x-5' : 'translate-x-0'
                                            }`}></div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Share link */}
                        {shareModal.document?.is_public && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Public Link
                                </label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={`${window.location.origin}/public/${shareModal.document.public_slug || shareModal.document.id}`}
                                        readOnly
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                `${window.location.origin}/public/${shareModal.document?.public_slug || shareModal.document?.id}`
                                            );
                                        }}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 text-sm"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Specific user sharing (placeholder for future implementation) */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Share with specific users
                            </label>
                            <div className="flex">
                                <input
                                    type="email"
                                    placeholder="Enter email address..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled
                                />
                                <button
                                    disabled
                                    className="px-4 py-2 bg-gray-300 text-gray-500 rounded-r-lg cursor-not-allowed"
                                >
                                    Add
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                User-specific sharing coming soon in Phase B
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setShareModal({ isOpen: false, document: null })}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
