import React, { useState } from 'react';
import { Grid, List, LayoutGrid, LayoutList } from 'lucide-react';
import DocumentCard from './DocumentCard';
import { Button } from '../ui';
import type { Database } from '../../lib/types';

// 🎓 LEARNING: Document grid component with view mode switching
// This demonstrates how to create flexible layout components

type Document = Database["public"]["Tables"]["documents"]["Row"];

export interface DocumentGridProps {
    documents: Document[];
    loading?: boolean;
    viewMode?: 'grid' | 'list';
    onViewModeChange?: (mode: 'grid' | 'list') => void;
    onShare?: (document: Document) => void;
    onStatusToggle?: (document: Document) => void;
    onMoreActions?: (document: Document) => void;
    updatingDocumentId?: string | null;
    emptyMessage?: string;
    className?: string;
}

const DocumentGrid: React.FC<DocumentGridProps> = ({
    documents,
    loading = false,
    viewMode = 'grid',
    onViewModeChange,
    onShare,
    onStatusToggle,
    onMoreActions,
    updatingDocumentId,
    emptyMessage = 'No documents found',
    className = ''
}) => {
    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className={`
            ${viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
        `}>
            {Array.from({ length: viewMode === 'grid' ? 6 : 5 }).map((_, i) => (
                <div
                    key={i}
                    className={`
                        bg-white rounded-lg border border-gray-200 p-6 animate-pulse
                        ${viewMode === 'list' ? 'flex items-center space-x-4' : ''}
                    `}
                >
                    {viewMode === 'grid' ? (
                        <>
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                <div className="flex space-x-2">
                                    <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                                    <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            </div>
                            <div className="mt-4 flex justify-between">
                                <div className="h-8 bg-gray-200 rounded w-20"></div>
                                <div className="flex space-x-2">
                                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="flex space-x-4">
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );

    // Empty state
    const EmptyState = () => (
        <div className="text-center py-12">
            <LayoutGrid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
                {emptyMessage}
            </h3>
            <p className="text-gray-500">
                Create your first document to get started.
            </p>
        </div>
    );

    return (
        <div className={className}>
            {/* View Mode Toggle */}
            {onViewModeChange && (
                <div className="flex items-center justify-end mb-6">
                    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                        <Button
                            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => onViewModeChange('grid')}
                            className="px-3 py-1.5"
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => onViewModeChange('list')}
                            className="px-3 py-1.5"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <LoadingSkeleton />
            ) : documents.length === 0 ? (
                <EmptyState />
            ) : (
                <div className={`
                    ${viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'space-y-4'
                    }
                `}>
                    {documents.map((document) => (
                        <DocumentCard
                            key={document.id}
                            document={document}
                            viewMode={viewMode}
                            onShare={onShare}
                            onStatusToggle={onStatusToggle}
                            onMoreActions={onMoreActions}
                            isUpdating={updatingDocumentId === document.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentGrid;
