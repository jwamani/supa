// 🎓 LEARNING: Editor Sidebar Component
// This component provides document outline, comments, and additional tools

import React, { useState } from 'react';
import {
    FileText,
    MessageSquare,
    Hash,
    Search,
    Settings,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Eye,
    EyeOff,
    Plus,
    X
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';

export interface EditorSidebarProps {
    isVisible: boolean;
    onToggle: () => void;

    // Document outline
    headings?: {
        id: string;
        level: number;
        text: string;
        position: number;
    }[];
    onHeadingClick?: (position: number) => void;

    // Comments
    comments?: {
        id: string;
        text: string;
        author: string;
        position: number;
        createdAt: Date;
        resolved?: boolean;
    }[];
    onAddComment?: (text: string, position: number) => void;
    onResolveComment?: (commentId: string) => void;

    // Editor settings
    wordWrap?: boolean;
    onWordWrapToggle?: () => void;
    spellCheck?: boolean;
    onSpellCheckToggle?: () => void;

    className?: string;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
    isVisible,
    onToggle,
    headings = [],
    onHeadingClick,
    comments = [],
    onAddComment,
    onResolveComment,
    wordWrap = true,
    onWordWrapToggle,
    spellCheck = true,
    onSpellCheckToggle,
    className = ''
}) => {
    const [activeTab, setActiveTab] = useState<'outline' | 'comments' | 'settings'>('outline');
    const [newComment, setNewComment] = useState('');
    const [showResolved, setShowResolved] = useState(false);
    const [outlineSearch, setOutlineSearch] = useState('');

    // 🎓 LEARNING: Filter headings based on search
    const filteredHeadings = headings.filter(heading =>
        heading.text.toLowerCase().includes(outlineSearch.toLowerCase())
    );

    // 🎓 LEARNING: Filter comments based on resolved status
    const filteredComments = comments.filter(comment =>
        showResolved || !comment.resolved
    );

    // 🎓 LEARNING: Handle adding new comment
    const handleAddComment = () => {
        if (newComment.trim() && onAddComment) {
            onAddComment(newComment.trim(), 0); // Position would be determined by cursor
            setNewComment('');
        }
    };

    // 🎓 LEARNING: Format comment timestamp
    const formatCommentTime = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    if (!isVisible) {
        return (
            <button
                onClick={onToggle}
                className="fixed right-4 top-1/2 -translate-y-1/2 p-2 bg-white border border-gray-300 rounded-l-lg shadow-lg hover:bg-gray-50 z-10"
                title="Show sidebar"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
        );
    }

    return (
        <div className={`w-80 bg-white border-l border-gray-200 flex flex-col ${className}`}>
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex space-x-1">
                    <button
                        onClick={() => setActiveTab('outline')}
                        className={`
              px-3 py-1 text-sm font-medium rounded-md transition-colors
              ${activeTab === 'outline'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }
            `}
                    >
                        <FileText className="w-4 h-4 inline mr-1" />
                        Outline
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`
              px-3 py-1 text-sm font-medium rounded-md transition-colors relative
              ${activeTab === 'comments'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }
            `}
                    >
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        Comments
                        {filteredComments.length > 0 && (
                            <Badge variant="primary" className="ml-1 text-xs">
                                {filteredComments.length}
                            </Badge>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`
              px-3 py-1 text-sm font-medium rounded-md transition-colors
              ${activeTab === 'settings'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }
            `}
                    >
                        <Settings className="w-4 h-4 inline mr-1" />
                        Settings
                    </button>
                </div>
                <button
                    onClick={onToggle}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Hide sidebar"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Outline Tab */}
                {activeTab === 'outline' && (
                    <div className="p-4">
                        {/* Search */}
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search headings..."
                                    value={outlineSearch}
                                    onChange={(e) => setOutlineSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Headings List */}
                        <div className="space-y-1">
                            {filteredHeadings.length > 0 ? (
                                filteredHeadings.map((heading) => (
                                    <button
                                        key={heading.id}
                                        onClick={() => onHeadingClick?.(heading.position)}
                                        className={`
                      w-full text-left p-2 rounded-md hover:bg-gray-100 transition-colors
                      ${heading.level === 1 ? 'font-semibold text-gray-900' : ''}
                      ${heading.level === 2 ? 'font-medium text-gray-800 ml-4' : ''}
                      ${heading.level >= 3 ? 'text-gray-700 ml-8' : ''}
                    `}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Hash className="w-3 h-3 text-gray-400" />
                                            <span className="truncate">{heading.text}</span>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    {outlineSearch ? 'No matching headings found' : 'No headings in document'}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                    <div className="p-4">
                        {/* Add Comment */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <textarea
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                            />
                            <div className="flex justify-between items-center mt-2">
                                <label className="flex items-center gap-2 text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={showResolved}
                                        onChange={(e) => setShowResolved(e.target.checked)}
                                        className="rounded"
                                    />
                                    Show resolved
                                </label>
                                <Button
                                    size="sm"
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add
                                </Button>
                            </div>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-3">
                            {filteredComments.length > 0 ? (
                                filteredComments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className={`
                      p-3 rounded-lg border transition-colors
                      ${comment.resolved
                                                ? 'bg-gray-50 border-gray-200 opacity-75'
                                                : 'bg-white border-yellow-200'
                                            }
                    `}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-medium text-white">
                                                    {comment.author[0].toUpperCase()}
                                                </div>
                                                <span className="font-medium text-sm text-gray-900">
                                                    {comment.author}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatCommentTime(comment.createdAt)}
                                                </span>
                                            </div>
                                            {!comment.resolved && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onResolveComment?.(comment.id)}
                                                    className="text-xs"
                                                >
                                                    Resolve
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            {comment.text}
                                        </p>
                                        {comment.resolved && (
                                            <Badge variant="success" className="mt-2 text-xs">
                                                Resolved
                                            </Badge>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No comments yet
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="p-4 space-y-4">
                        <h3 className="font-medium text-gray-900 mb-3">Editor Settings</h3>

                        {/* Word Wrap */}
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="font-medium text-sm text-gray-900">Word Wrap</label>
                                <p className="text-xs text-gray-600">Wrap long lines to fit editor width</p>
                            </div>
                            <button
                                onClick={onWordWrapToggle}
                                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${wordWrap ? 'bg-blue-600' : 'bg-gray-200'}
                `}
                            >
                                <span
                                    className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${wordWrap ? 'translate-x-6' : 'translate-x-1'}
                  `}
                                />
                            </button>
                        </div>

                        {/* Spell Check */}
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <label className="font-medium text-sm text-gray-900">Spell Check</label>
                                <p className="text-xs text-gray-600">Check spelling as you type</p>
                            </div>
                            <button
                                onClick={onSpellCheckToggle}
                                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${spellCheck ? 'bg-blue-600' : 'bg-gray-200'}
                `}
                            >
                                <span
                                    className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${spellCheck ? 'translate-x-6' : 'translate-x-1'}
                  `}
                                />
                            </button>
                        </div>

                        {/* Visual Settings */}
                        <div className="border-t pt-4">
                            <h4 className="font-medium text-sm text-gray-900 mb-3">Visual</h4>
                            <div className="space-y-2">
                                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                                    Toggle Focus Mode
                                </button>
                                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                                    Toggle Typewriter Mode
                                </button>
                                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                                    Increase Font Size
                                </button>
                                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                                    Decrease Font Size
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditorSidebar;
