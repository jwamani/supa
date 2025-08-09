// 🎓 LEARNING: Modern Document Page using our Component System
// This demonstrates how to integrate all our professional components
import { Editor } from "@tiptap/react";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Share2, Users, Settings } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useDocumentsStore } from "../store/documentsStore";
import type { Database } from "../lib/types";

// 🎓 LEARNING: Import our new component system
import {
    PageLayout,
    Button,
    LoadingSpinner,
    ShareDocumentModal,
    EditorToolbar,
    EditorStatus,
    EditorSidebar
} from "../components";

import TiptapEditor from "../components/TiptapEditor";
import { useEditorStats } from "../hooks/useEditorStats";

type Document = Database["public"]["Tables"]["documents"]["Row"];

export const ModernDocumentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { getDocument, updateDocument } = useDocumentsStore();
    const { getWordCount, getReadingTime, getCharCount } = useEditorStats();

    // 🎓 LEARNING: Document state management
    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [content, setContent] = useState("");
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // 🎓 LEARNING: Editor UI state
    const [showShareModal, setShowShareModal] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [minRead, setMinRead] = useState(0);

    // 🎓 LEARNING: Editor reference for toolbar integration
    const [editor, setEditor] = useState<Editor|null>(null);

    // 🎓 LEARNING: Mock data for demonstration
    const [headings] = useState([
        { id: '1', level: 1, text: 'Introduction', position: 0 },
        { id: '2', level: 2, text: 'Getting Started', position: 100 },
        { id: '3', level: 3, text: 'Installation', position: 200 },
        { id: '4', level: 2, text: 'Features', position: 300 },
    ]);

    const [comments] = useState([
        {
            id: '1',
            text: 'This section needs more detail',
            author: 'John Doe',
            position: 150,
            createdAt: new Date(Date.now() - 3600000), // 1 hour ago
            resolved: false
        }
    ]);

    const [activeUsers] = useState([
        { id: '1', name: 'John Doe', color: '#3b82f6' },
        { id: '2', name: 'Jane Smith', color: '#10b981' }
    ]);

    // 🎓 LEARNING: Load document on component mount
    useEffect(() => {
        const loadDocument = async () => {
            if (!id) {
                setError("Document ID is required");
                setLoading(false);
                return;
            }

            try {
                const doc = await getDocument(id);
                if (doc) {
                    setDocument(doc);
                    setContent(doc.content_text || "");
                    setLastSaved(new Date(doc.updated_at));
                    setWordCount(doc.word_count);
                    setCharCount(doc.character_count);
                    setMinRead(doc.reading_time_minutes);
                } else {
                    setError("Document not found");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load document");
            } finally {
                setLoading(false);
            }
        };

        loadDocument();
    }, [id, getDocument]);

    // 🎓 LEARNING: Auto-save functionality
    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    

    const handleUpdate = (newContent: any) => {
        console.log("Update from tiptap editor", newContent);

        const extractText = () => {
            const text = editor?.getText();
            return text ?? "";
        }
        const text = extractText();

        setWordCount(getWordCount(text ?? ""));
        setCharCount(getCharCount(text ?? ""));
        setMinRead(getReadingTime(wordCount));

        console.log("Extracted text: ", text)
        setContent(text ?? "");

        // store jsonb content but dont save immediately
        if (document) {
            setDocument(prev => prev ? { ...prev, content: newContent } : null);
        }
    }


    // 🎓 LEARNING: Save document function
    const saveDocument = async () => {
        if (!document || !id || saving) return;

        setSaving(true);
        try {
            const updates = {
                content: document.content
            };

            console.log("💾 DocumentPage: Updates to send:", updates);
            const updatedDoc = await updateDocument(id, updates)

            console.log("💾 DocumentPage: Save successful:", updatedDoc.id);

            setDocument(updatedDoc);
            setLastSaved(new Date());

            console.log("Save completed successfully")

        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSaving(false);
        }
    };
    useEffect(() => {
        if (!document || saving) {
            return;
        }
        const contentChanged = content !== (document.content_text || "");

        if (!contentChanged) {
            console.log("Auo-save: No changes detected");
            return;
        }
        
        console.log("Auto save: Changes detected, starting timer...", {
            content
        })

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            console.log("Auto-save: Saved fired...");
            saveDocument();
        }, 5000);

    }, [content]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        }
    }, []);
    // 🎓 LEARNING: Navigation handlers
    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const handleShare = () => {
        setShowShareModal(true);
    };

    // 🎓 LEARNING: Loading state
    if (loading) {
        return (
            <PageLayout>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            </PageLayout>
        );
    }

    // 🎓 LEARNING: Error state
    if (error || !document) {
        return (
            <PageLayout>
                <div className="text-center py-12">
                    <div className="text-red-600 mb-4">
                        <p className="text-lg font-medium">Error loading document</p>
                        <p className="text-sm text-gray-600">{error}</p>
                    </div>
                    <Button onClick={handleBackToDashboard}>
                        Back to Dashboard
                    </Button>
                </div>
            </PageLayout>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* 🎓 LEARNING: Document Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToDashboard}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900 truncate max-w-md">
                                {document.title}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Last saved {lastSaved ? lastSaved.toLocaleString() : 'Never'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShare}
                            className="flex items-center gap-2"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="flex items-center gap-2"
                        >
                            <Settings className="w-4 h-4" />
                            {showSidebar ? 'Hide' : 'Show'} Sidebar
                        </Button>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Users className="w-4 h-4" />
                            <span>{activeUsers.length}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* 🎓 LEARNING: Editor Toolbar */}
            <EditorToolbar editor={editor} className="border-b" />

            {/* 🎓 LEARNING: Main Editor Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Editor Container */}
                <div className="flex-1 flex flex-col">
                    {/* Editor */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto">
                            <TiptapEditor
                                content={document.content}
                                onUpdate={handleUpdate}
                                onEditorReady={setEditor}
                                saving={saving}
                                editable={true}
                                lastSaved={lastSaved}
                                placeholder="Start writing your document..."
                                className="min-h-96 prose prose-lg max-w-none"
                            />
                        </div>
                    </div>

                    {/* 🎓 LEARNING: Editor Status Bar */}
                    <EditorStatus
                        isSaving={saving}
                        lastSaved={lastSaved}
                        isOnline={true}
                        hasUnsavedChanges={hasUnsavedChanges}
                        wordCount={wordCount}
                        charCount={charCount}
                        minutes_read={minRead}
                        activeUsers={activeUsers}
                    />
                </div>

                {/* 🎓 LEARNING: Editor Sidebar */}
                <EditorSidebar
                    isVisible={showSidebar}
                    onToggle={() => setShowSidebar(!showSidebar)}
                    headings={headings}
                    onHeadingClick={(position) => {
                        // Scroll to heading position
                        console.log('Scroll to position:', position);
                    }}
                    comments={comments}
                    onAddComment={(text, position) => {
                        console.log('Add comment:', text, position);
                    }}
                    onResolveComment={(commentId) => {
                        console.log('Resolve comment:', commentId);
                    }}
                    wordWrap={true}
                    spellCheck={true}
                    onWordWrapToggle={() => console.log('Toggle word wrap')}
                    onSpellCheckToggle={() => console.log('Toggle spell check')}
                />
            </div>

            {/* 🎓 LEARNING: Share Modal */}
            <ShareDocumentModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                documentId={document.id}
                documentTitle={document.title}
                onShare={async (email, permission) => {
                    console.log('Share with:', email, permission);
                    // Implement sharing logic
                }}
            />
        </div>
    );
};

export default ModernDocumentPage;
