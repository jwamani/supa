import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    FileText,
    Share2,
    MessageCircle,
    History,
    MoreVertical,
    Save,
    Clock,
    User,
    Eye,
    CheckCircle,
    Archive,
    Globe,
    Lock
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useDocumentsStore } from "../store/documentsStore";
import type { Database } from "../lib/types";
import { TiptapEditor } from "../components/TiptapEditor";

type Document = Database["public"]["Tables"]["documents"]["Row"]
export const DocumentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getDocument, updateDocument } = useDocumentsStore();

    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

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

    // Toggle document status
    const handleStatusToggle = async () => {
        if (!document) return;

        const newStatus = document.status === 'published' ? 'draft' : 'published';
        try {
            setUpdatingStatus(true);
            const updatedDoc = await updateDocument(document.id, { status: newStatus });
            setDocument(updatedDoc);
        } catch (err) {
            console.error('Error updating document status:', err);
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Load document on mount
    useEffect(() => {
        const loadDocument = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const doc = await getDocument(id);
                setDocument(doc);
                setTitle(doc.title);
                setContent(doc.content_text || "");
                setError(null);
            } catch (err) {
                console.error("Error loading document:", err);
                setError("Failed to load document");
            } finally {
                setLoading(false);
            }
        };

        loadDocument();
    }, [id, getDocument]);

    const handleUpdate = (newContent: any) => {

    }

    // Auto-save functionality
    const saveDocument = async () => {
        if (!id || !document) return;

        try {
            setSaving(true);
            console.log("💾 DocumentPage: Starting save...");
            console.log("💾 DocumentPage: Title:", title);
            console.log("💾 DocumentPage: Content length:", content.length);

            const updates = {
                title: title.trim(),
                // Update the JSONB content field instead of content_text
                // The trigger will automatically extract content_text from this
                content: {
                    type: "doc",
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: content
                                }
                            ]
                        }
                    ]
                }
                // Remove word_count and character_count - the trigger calculates these
            };

            console.log("💾 DocumentPage: Updates to send:", updates);

            const updatedDoc = await updateDocument(id, updates);
            console.log("💾 DocumentPage: Save successful:", updatedDoc.id);

            setLastSaved(new Date());
        } catch (err) {
            console.error("💾 DocumentPage: Save failed:", err);
            // You might want to show a toast notification here
        } finally {
            setSaving(false);
        }
    };

    // Auto-save on title or content change (debounced)
    useEffect(() => {
        if (!document || (title === document.title && content === (document.content_text || ""))) {
            return; // No changes to save
        }

        const timeoutId = setTimeout(() => {
            saveDocument();
        }, 2000); // Auto-save after 2 seconds of inactivity

        return () => clearTimeout(timeoutId);
    }, [title, content, document]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Error state
    if (error || !document) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">
                        {error || "Document not found"}
                    </div>
                    <Link
                        to="/dashboard"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        {/* Left side - Back button and title */}
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/dashboard"
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                title="Back to Dashboard"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>

                            <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-semibold text-gray-900">
                                        {document.title}
                                    </h1>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                        {/* Status indicator */}
                                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(document.status).bg} ${getStatusInfo(document.status).color}`}>
                                            {React.createElement(getStatusInfo(document.status).icon, { className: "h-3 w-3" })}
                                            <span>{getStatusInfo(document.status).label}</span>
                                        </div>

                                        <span>
                                            Last edited {new Date(document.updated_at).toLocaleDateString()}
                                        </span>
                                        {saving && (
                                            <div className="flex items-center space-x-1 text-blue-600">
                                                <Save className="h-3 w-3 animate-pulse" />
                                                <span>Saving...</span>
                                            </div>
                                        )}
                                        {lastSaved && !saving && (
                                            <div className="flex items-center space-x-1 text-green-600">
                                                <Clock className="h-3 w-3" />
                                                <span>Saved {lastSaved.toLocaleTimeString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex items-center space-x-2">
                            {/* Status toggle button */}
                            <button
                                onClick={handleStatusToggle}
                                disabled={updatingStatus}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${document.status === 'published'
                                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    } disabled:opacity-50`}
                            >
                                {updatingStatus ? 'Updating...' : (
                                    document.status === 'published' ? 'Make Draft' : 'Publish'
                                )}
                            </button>

                            {/* Public indicator */}
                            {document.is_public && (
                                <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                    <Globe className="h-3 w-3" />
                                    <span>Public</span>
                                </div>
                            )}
                            {/* Collaborators (placeholder) */}
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium">
                                    JD
                                </div>
                                <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium">
                                    JS
                                </div>
                            </div>

                            {/* Action buttons */}
                            <button
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                title="Comments"
                            >
                                <MessageCircle className="h-5 w-5" />
                            </button>

                            <button
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                title="Version History"
                            >
                                <History className="h-5 w-5" />
                            </button>

                            <button className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </button>

                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                <MoreVertical className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Document Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-sm border min-h-[600px]">
                            {/* Document Title Editor */}
                            <div className="border-b p-6">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full text-2xl font-bold text-gray-900 border-none outline-none focus:ring-0 p-0 bg-transparent"
                                    placeholder="Document title..."
                                />
                            </div>

                            {/* Content Editor */}
                            <div className="p-6">
                                {/* <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full min-h-[400px] border-none outline-none focus:ring-0 resize-none bg-transparent text-gray-900 leading-relaxed"
                                    placeholder="Start writing your document..."
                                    style={{ fontSize: '16px', lineHeight: '1.6' }}
                                /> */}

                                <TiptapEditor content={document.content} onUpdate={handleUpdate} />

                                {/* Editor Status */}
                                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                    <div className="flex items-center space-x-4">
                                        <span>{content.split(' ').filter(word => word.length > 0).length} words</span>
                                        <span>{content.length} characters</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {saving && (
                                            <div className="flex items-center space-x-1 text-blue-600">
                                                <Save className="h-3 w-3 animate-pulse" />
                                                <span>Auto-saving...</span>
                                            </div>
                                        )}
                                        {lastSaved && !saving && (
                                            <div className="flex items-center space-x-1 text-green-600">
                                                <Clock className="h-3 w-3" />
                                                <span>Saved at {lastSaved.toLocaleTimeString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Future Editor Notice */}
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm text-blue-700">
                                            Rich text editor (TipTap) will be integrated in Phase B
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="space-y-6">
                            {/* Document Info */}
                            <div className="bg-white rounded-lg shadow-sm border p-4">
                                <h3 className="font-medium text-gray-900 mb-3">
                                    Document Info
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <span className="text-gray-500">Created:</span>
                                        <div className="text-gray-900">
                                            {new Date(document.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Last Updated:</span>
                                        <div className="text-gray-900">
                                            {new Date(document.updated_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Status:</span>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${document.status === 'published'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {document.status?.charAt(0).toUpperCase() + document.status?.slice(1) || 'Draft'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Word Count:</span>
                                        <div className="text-gray-900">
                                            {document.word_count || content.split(' ').filter(word => word.length > 0).length} words
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Views:</span>
                                        <div className="text-gray-900">
                                            {document.view_count || 0} views
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Comments Panel */}
                            <div className="bg-white rounded-lg shadow-sm border p-4">
                                <h3 className="font-medium text-gray-900 mb-3">Comments</h3>
                                <div className="text-sm text-gray-500 text-center py-8">
                                    No comments yet.
                                    <br />
                                    Comments feature coming soon!
                                </div>
                            </div>

                            {/* Activity Feed */}
                            <div className="bg-white rounded-lg shadow-sm border p-4">
                                <h3 className="font-medium text-gray-900 mb-3">
                                    Recent Activity
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-start space-x-2 text-sm">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                        <div>
                                            <span className="text-gray-900">You</span>
                                            <span className="text-gray-500">
                                                {" "}
                                                opened this document
                                            </span>
                                            <div className="text-gray-400 text-xs">Just now</div>
                                        </div>
                                    </div>

                                    {lastSaved && (
                                        <div className="flex items-start space-x-2 text-sm">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <div>
                                                <span className="text-gray-900">You</span>
                                                <span className="text-gray-500">
                                                    {" "}
                                                    saved changes
                                                </span>
                                                <div className="text-gray-400 text-xs">
                                                    {lastSaved.toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-center py-4">
                                        <span className="text-xs text-gray-400">
                                            Real-time activity tracking coming in Phase B
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
