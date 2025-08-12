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
    Lock,
    Trash2,
    AlertTriangle,
    X
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useDocumentsStore } from "../store/documentsStore";
import type { Database } from "../lib/types";
import TiptapEditor from "../components/TiptapEditor";
import { ShareModal } from "../components/ShareModal";

type Document = Database["public"]["Tables"]["documents"]["Row"]
export const DocumentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getDocument, updateDocument, deleteDocument } = useDocumentsStore();

    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Add debounce ref to prevent rapid saves
    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // 🗑️ LEARNING: Delete confirmation state management
    // This demonstrates how to handle destructive actions with user confirmation
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // 🤝 LEARNING: Sharing modal state management
    // This demonstrates permission management UI patterns
    const [showShareModal, setShowShareModal] = useState(false);

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

    // 🗑️ LEARNING: Delete handler with navigation
    // This demonstrates proper cleanup after destructive operations
    const handleDeleteDocument = async () => {
        if (!document) return;

        try {
            setDeleting(true);

            // Use the imported deleteDocument function
            await deleteDocument(document.id);

            console.log('✅ Document deleted successfully');

            // Navigate back to dashboard after successful deletion
            navigate('/', { replace: true });
        } catch (err) {
            console.error('❌ Error deleting document:', err);
            // In a real app, you'd show a toast notification here
            alert('Failed to delete document. Please try again.');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
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

                // 🎓 LEARNING: Proper content loading for rich text editor
                // Load the JSONB content for TipTap, fallback to plain text
                const loadedContent = doc.content_text || "";
                setContent(loadedContent);

                console.log("📄 Document loaded:", {
                    id: doc.id,
                    title: doc.title,
                    hasJsonbContent: !!doc.content,
                    contentTextLength: doc.content_text?.length || 0,
                    status: doc.status
                });

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

    // 🎓 LEARNING: Handle content updates from TipTap editor
    // This function receives rich content from TipTap and updates our state
    const handleUpdate = (newContent: any) => {
        console.log("📝 Content update from TipTap:", newContent);

        // 🎓 LEARNING: Extract plain text from TipTap JSON structure
        // TipTap provides JSONB content, we need to extract text for our content state
        const extractText = (content: any): string => {
            if (!content || !content.content) return '';

            const extractFromNode = (node: any): string => {
                if (node.type === 'text') {
                    return node.text || '';
                }

                if (node.content && Array.isArray(node.content)) {
                    return node.content.map(extractFromNode).join('');
                }

                return '';
            };

            return content.content.map((node: any) => {
                const text = extractFromNode(node);
                // Add line breaks for block elements
                if (node.type === 'paragraph' || node.type === 'heading') {
                    return text + '\n';
                }
                if (node.type === 'bulletList' || node.type === 'orderedList') {
                    return text + '\n';
                }
                return text;
            }).join('').trim();
        };

        const newTextContent = extractText(newContent);
        console.log("📝 Extracted text:", newTextContent);

        // Update our content state - this will trigger auto-save
        setContent(newTextContent);

        // Store the JSONB content for database saves (but don't update document state yet)
        // We'll update it after successful save to avoid infinite loops
        if (document) {
            setDocument(prev => prev ? { ...prev, content: newContent } : null);
        }
    };

    // 💾 LEARNING: Enhanced auto-save functionality
    // This demonstrates proper content synchronization with database
    const saveDocument = async () => {
        if (!id || !document || saving) {
            console.log("🚫 Save blocked:", { id: !!id, document: !!document, saving });
            return;
        }

        try {
            setSaving(true);
            console.log("💾 DocumentPage: Starting save...");
            console.log("💾 DocumentPage: Title:", title);
            console.log("💾 DocumentPage: Content length:", content.length);

            // 🎓 LEARNING: Prepare updates for database
            // We save JSONB content and let the database trigger extract plain text automatically
            const updates = {
                title: title.trim(),
                // Use the actual JSONB content from TipTap editor
                content: document.content || {
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
                // content_text is automatically extracted by database trigger
            };
            
            console.log("💾 DocumentPage: Updates to send:", updates);

            const updatedDoc = await updateDocument(id, updates);
            console.log("💾 DocumentPage: Save successful:", updatedDoc.id);

            // Update our local document state with the saved version
            // This prevents infinite save loops by syncing our state
            setDocument(updatedDoc);
            setLastSaved(new Date());

            console.log("✅ Save completed successfully");
        } catch (err) {
            console.error("💾 DocumentPage: Save failed:", err);
            // TODO: Add toast notification for better UX
            setError("Failed to save document. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // Auto-save on title or content change (debounced)
    useEffect(() => {
        if (!document || saving) {
            console.log("🚫 Auto-save: Blocked", { hasDocument: !!document, saving });
            return;
        }

        const titleChanged = title !== document.title;
        const contentChanged = content !== (document.content_text || "");

        if (!titleChanged && !contentChanged) {
            console.log("🚫 Auto-save: No changes detected");
            return; // No changes to save
        }

        console.log("⏳ Auto-save: Changes detected, starting timer...", {
            titleChanged,
            contentChanged
        });

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout
        saveTimeoutRef.current = setTimeout(() => {
            console.log("💾 Auto-save: Timer fired, saving...");
            saveDocument();
        }, 1000); // 1 second debounce

        return () => {
            if (saveTimeoutRef.current) {
                console.log("🔄 Auto-save: Timer cleared");
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
        };
    }, [title, content, document?.title]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

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

                            <button
                                onClick={() => setShowShareModal(true)}
                                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </button>

                            {/* 🗑️ LEARNING: Destructive action button with clear visual indication */}
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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

                            {/* Content Editor - Improved Layout */}
                            <div className="p-0">
                                {/* 🎓 LEARNING: Enhanced TipTap Integration with cleaner container */}
                                {document ? (
                                    <TiptapEditor
                                        content={document.content || {
                                            type: "doc",
                                            content: [
                                                {
                                                    type: "paragraph",
                                                    content: [
                                                        {
                                                            type: "text",
                                                            text: content || "Start writing your document..."
                                                        }
                                                    ]
                                                }
                                            ]
                                        }}
                                        onUpdate={handleUpdate}
                                        placeholder="Start writing your document..."
                                        editable={true}
                                        saving={saving}
                                        lastSaved={lastSaved}
                                    />
                                ) : (
                                    <div className="min-h-[400px] flex items-center justify-center text-gray-500 p-6">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                            <p>Loading editor...</p>
                                        </div>
                                    </div>
                                )}
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

            {/* 🗑️ LEARNING: Confirmation Modal for Destructive Actions */}
            {/* This demonstrates proper UX patterns for dangerous operations */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                        <div className="flex items-center space-x-3 mb-4 justify-between">
                            <div className="flex items-center space-x-3" >
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Delete Document
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        This action cannot be undone.
                                    </p>
                                </div>
                            </div>


                            <button className="hover:text-black text-gray-500" onClick={() => setShowDeleteModal(false)} >
                                <X />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-gray-700">
                                Are you sure you want to delete <strong>"{document?.title}"</strong>?
                                This will permanently remove the document and all its content.
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteDocument}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 flex items-center space-x-2"
                            >
                                {deleting && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                                <span>{deleting ? 'Deleting...' : 'Delete Document'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🤝 LEARNING: Enhanced ShareModal Component */}
            {/* This demonstrates using a reusable component for complex functionality */}
            <ShareModal
                documentId={id!}
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                document={document}
            />
        </div>
    );
};
