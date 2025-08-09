// 🎓 LEARNING: Modernized Dashboard using our Component System
// This demonstrates how to integrate all our new components for a professional interface

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useDocuments } from '../hooks/useDocuments';
import type { Database } from '../lib/types';

// 🎓 LEARNING: Import our professional component system
import {
    PageLayout,
    DocumentGrid,
    CreateDocumentModal,
    ShareDocumentModal,
    Button,
    Input,
    LoadingSpinner,
    Badge
} from '../components';

import {
    Plus,
    Search,
    Filter,
    Grid3X3,
    List,
    RefreshCw,
    SortAsc,
    SortDesc
} from 'lucide-react';

type ViewMode = "grid" | "list";
type SortOption = "updated" | "created" | "title";
type SortDirection = "asc" | "desc";
type Document = Database["public"]["Tables"]["documents"]["Row"];

export const ModernDashboardPage: React.FC = () => {
    const { user } = useAuthStore();
    const { documents, loading, error, createDocument, deleteDocument, refetch } = useDocuments();
    const navigate = useNavigate();

    // 🎓 LEARNING: State management for modern UI
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [shareModal, setShareModal] = useState<{ isOpen: boolean; document: Document | null }>({
        isOpen: false,
        document: null
    });
    const [sortBy, setSortBy] = useState<SortOption>('updated');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [refreshing, setRefreshing] = useState(false);

    // 🎓 LEARNING: Filter and sort documents
    const filteredAndSortedDocuments = React.useMemo(() => {
        let filtered = documents.filter(doc =>
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.content_text?.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        // Sort documents
        filtered.sort((a, b) => {
            let valueA: any;
            let valueB: any;

            if (sortBy === 'title') {
                valueA = a.title.toLowerCase();
                valueB = b.title.toLowerCase();
            } else if (sortBy === 'updated') {
                valueA = new Date(a.updated_at);
                valueB = new Date(b.updated_at);
            } else { // created
                valueA = new Date(a.created_at);
                valueB = new Date(b.created_at);
            }

            if (sortDirection === 'asc') {
                return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
            } else {
                return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
            }
        });

        return filtered;
    }, [documents, searchQuery, sortBy, sortDirection]);

    // 🎓 LEARNING: Handle document creation with template support
    const handleCreateDocument = async (title: string, template?: string) => {
        try {
            const templateContent = getTemplateContent(template);
            const newDoc = await createDocument(title, templateContent);
            setShowCreateModal(false);

            // Navigate to the new document
            if (newDoc) {
                navigate(`/document/${newDoc.id}`);
            }
        } catch (err) {
            console.error('Error creating document:', err);
        }
    };

    // 🎓 LEARNING: Template content generator
    const getTemplateContent = (template?: string) => {
        switch (template) {
            case 'meeting-notes':
                return `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Attendees:</strong> </p>
<p><strong>Agenda:</strong></p>
<ul><li></li></ul>
<p><strong>Action Items:</strong></p>
<ul><li></li></ul>
<p><strong>Next Steps:</strong></p>
<ul><li></li></ul>`;

            case 'project-plan':
                return `<h1>Project Plan</h1>
<p><strong>Project Name:</strong> </p>
<p><strong>Start Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>End Date:</strong> </p>
<h2>Objectives</h2>
<ul><li></li></ul>
<h2>Milestones</h2>
<ul><li></li></ul>
<h2>Resources</h2>
<ul><li></li></ul>
<h2>Risks</h2>
<ul><li></li></ul>`;

            default:
                return '<p>Start writing your document here...</p>';
        }
    };

    // 🎓 LEARNING: Handle document actions
    const handleDocumentClick = (doc: Document) => {
        navigate(`/document/${doc.id}`);
    };

    const handleShareDocument = (doc: Document) => {
        setShareModal({ isOpen: true, document: doc });
    };

    const handleDeleteDocument = async (doc: Document) => {
        if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
            try {
                await deleteDocument(doc.id);
            } catch (err) {
                console.error('Error deleting document:', err);
            }
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await refetch();
        } finally {
            setRefreshing(false);
        }
    };

    // 🎓 LEARNING: Toggle sort direction
    const handleSortToggle = (newSortBy: SortOption) => {
        if (sortBy === newSortBy) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(newSortBy);
            setSortDirection('desc');
        }
    };

    // 🎓 LEARNING: Loading state
    if (loading && documents.length === 0) {
        return (
            <PageLayout>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            </PageLayout>
        );
    }

    // 🎓 LEARNING: Error state
    if (error) {
        return (
            <PageLayout>
                <div className="text-center py-12">
                    <div className="text-red-600 mb-4">
                        <p className="text-lg font-medium">Failed to load documents</p>
                        <p className="text-sm text-gray-600">{error}</p>
                    </div>
                    <Button onClick={handleRefresh}>
                        Try Again
                    </Button>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="space-y-6">
                {/* 🎓 LEARNING: Page Header with Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
                        <p className="text-gray-600">
                            {documents.length} document{documents.length !== 1 ? 's' : ''}
                            {searchQuery && ` matching "${searchQuery}"`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            disabled={refreshing}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Document
                        </Button>
                    </div>
                </div>

                {/* 🎓 LEARNING: Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Sort Controls */}
                        <div className="flex items-center gap-1 border rounded-lg p-1">
                            <Button
                                size="sm"
                                variant={sortBy === 'updated' ? 'primary' : 'outline'}
                                onClick={() => handleSortToggle('updated')}
                                className="text-xs"
                            >
                                Updated
                                {sortBy === 'updated' && (
                                    sortDirection === 'desc' ? <SortDesc className="w-3 h-3 ml-1" /> : <SortAsc className="w-3 h-3 ml-1" />
                                )}
                            </Button>
                            <Button
                                size="sm"
                                variant={sortBy === 'title' ? 'primary' : 'outline'}
                                onClick={() => handleSortToggle('title')}
                                className="text-xs"
                            >
                                Title
                                {sortBy === 'title' && (
                                    sortDirection === 'desc' ? <SortDesc className="w-3 h-3 ml-1" /> : <SortAsc className="w-3 h-3 ml-1" />
                                )}
                            </Button>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center border rounded-lg p-1">
                            <Button
                                size="sm"
                                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                                onClick={() => setViewMode('grid')}
                                className="px-2"
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant={viewMode === 'list' ? 'primary' : 'outline'}
                                onClick={() => setViewMode('list')}
                                className="px-2"
                            >
                                <List className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 🎓 LEARNING: Documents Grid/List */}
                <DocumentGrid
                    documents={filteredAndSortedDocuments}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onShare={handleShareDocument}
                    onMoreActions={handleDeleteDocument}
                    loading={refreshing}
                />

                {/* 🎓 LEARNING: Empty State */}
                {filteredAndSortedDocuments.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            {searchQuery ? (
                                <>
                                    <Search className="w-12 h-12 mx-auto mb-3" />
                                    <p className="text-lg font-medium">No documents found</p>
                                    <p className="text-sm">Try adjusting your search query</p>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-12 h-12 mx-auto mb-3" />
                                    <p className="text-lg font-medium">No documents yet</p>
                                    <p className="text-sm">Create your first document to get started</p>
                                </>
                            )}
                        </div>
                        {!searchQuery && (
                            <Button onClick={() => setShowCreateModal(true)}>
                                Create Your First Document
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* 🎓 LEARNING: Modal Components */}
            <CreateDocumentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateDocument}
            />

            {/* Only render ShareDocumentModal when we have a document */}
            {shareModal.document && (
                <ShareDocumentModal
                    key={shareModal.document.id} // Add key for proper React reconciliation
                    isOpen={shareModal.isOpen}
                    onClose={() => setShareModal({ isOpen: false, document: null })}
                    documentId={shareModal.document.id}
                    documentTitle={shareModal.document.title}
                    // In a real app, you'd pass sharing handlers here
                    onShare={async (email, permission) => {
                        console.log('Share document with:', email, permission);
                        // Implement actual sharing logic
                    }}
                />
            )}
        </PageLayout>
    );
};
