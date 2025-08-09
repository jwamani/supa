import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Share2,
    MoreVertical,
    Calendar,
    Eye,
    Users,
    Clock,
    CheckCircle,
    Archive,
    Globe,
    Lock,
    Delete,
    DeleteIcon,
    Trash,
    Trash2
} from 'lucide-react';
import { Card, Badge, Button } from '../ui';
import type { Database } from '../../lib/types';

// 🎓 LEARNING: Document card component for grid/list views
// This demonstrates how to create reusable item components with actions

type Document = Database["public"]["Tables"]["documents"]["Row"];

export interface DocumentCardProps {
    document: Document;
    viewMode?: 'grid' | 'list';
    onShare?: (document: Document) => void;
    onStatusToggle?: (document: Document) => void;
    onMoreActions?: (document: Document) => void;
    isUpdating?: boolean;
    className?: string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
    document,
    viewMode = 'grid',
    onShare,
    onStatusToggle,
    onMoreActions,
    isUpdating = false,
    className = ''
}) => {
    const navigate = useNavigate();

    // Get status display information
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'published':
                return {
                    icon: CheckCircle,
                    variant: 'success' as const,
                    label: 'Published'
                };
            case 'draft':
                return {
                    icon: Clock,
                    variant: 'warning' as const,
                    label: 'Draft'
                };
            case 'archived':
                return {
                    icon: Archive,
                    variant: 'default' as const,
                    label: 'Archived'
                };
            default:
                return {
                    icon: Clock,
                    variant: 'default' as const,
                    label: 'Draft'
                };
        }
    };

    const statusInfo = getStatusInfo(document.status);
    const StatusIcon = statusInfo.icon;

    // Calculate reading time (approximate)
    const readingTime = Math.max(1, Math.ceil((document.word_count || 0) / 200));

    // Handle card click to navigate to document
    const handleCardClick = () => {
        navigate(`/document/${document.id}`);
    };

    // Grid view layout
    if (viewMode === 'grid') {
        return (
            <Card
                hover
                className={`group transition-all duration-200 ${className}`}
            >
                {/* Clickable content area */}
                <div
                    onClick={handleCardClick}
                    className="cursor-pointer"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Status Badge */}
                            <Badge variant={statusInfo.variant} size="sm" icon={<StatusIcon />}>
                                {statusInfo.label}
                            </Badge>

                            {/* Public Indicator */}
                            {document.is_public && (
                                <Badge variant="info" size="sm" icon={<Globe />}>
                                    Public
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {document.title}
                    </h3>

                    {/* Content Preview */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {document.content_text || 'No content yet'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                                <FileText className="h-4 w-4 mr-1" />
                                {document.word_count || 0} words
                            </span>
                            <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {readingTime} min
                            </span>
                            {document.view_count && document.view_count > 0 && (
                                <span className="flex items-center">
                                    <Eye className="h-4 w-4 mr-1" />
                                    {document.view_count}
                                </span>
                            )}
                        </div>
                        <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(document.updated_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Actions - outside clickable area */}
                <div className="flex items-center justify-between"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                        variant={document.status === 'published' ? 'outline' : 'primary'}
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onStatusToggle?.(document);
                        }}
                        disabled={isUpdating}
                        className="text-xs"
                    >
                        {isUpdating ? '...' : (
                            document.status === 'published' ? 'Make Draft' : 'Publish'
                        )}
                    </Button>

                    <div className="flex items-center space-x-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onShare?.(document);
                            }}
                            className="p-1"
                            aria-label="Share document"
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoreActions?.(document);
                            }}
                            className="p-1"
                            aria-label="More actions"
                        >
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    // List view layout
    return (
        <Card
            hover
            padding="md"
            className={`group transition-all duration-200 ${className}`}
        >
            <div className="flex items-center justify-between">
                {/* Left side - Document info (clickable) */}
                <div
                    className="flex items-center space-x-4 flex-1 min-w-0 cursor-pointer"
                    onClick={handleCardClick}
                >
                    <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <FileText className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {document.title}
                            </h3>
                            <Badge variant={statusInfo.variant} size="sm" icon={<StatusIcon />}>
                                {statusInfo.label}
                            </Badge>
                            {document.is_public && (
                                <Badge variant="info" size="sm" icon={<Globe />}>
                                    Public
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                            {document.content_text || 'No content yet'}
                        </p>
                    </div>
                </div>

                {/* Right side - Stats and actions (not clickable) */}
                <div
                    className="flex items-center space-x-6 text-sm text-gray-500"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center space-x-4">
                        <span>{document.word_count || 0} words</span>
                        <span>{readingTime} min read</span>
                        <span>{new Date(document.updated_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                        <Button
                            variant={document.status === 'published' ? 'outline' : 'primary'}
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onStatusToggle?.(document);
                            }}
                            disabled={isUpdating}
                            className="text-xs"
                        >
                            {isUpdating ? '...' : (
                                document.status === 'published' ? 'Draft' : 'Publish'
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onShare?.(document);
                            }}
                            className="p-1"
                            aria-label="Share document"
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoreActions?.(document);
                            }}
                            className="p-1"
                            aria-label="More actions"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default DocumentCard;
