import React from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
    Bold,
    Italic,
    Underline,
    Heading1,
    Heading2,
    List,
    ListOrdered,
    Quote,
    Code,
    Strikethrough
} from "lucide-react";
import "../styles/editor.css";

interface TiptapEditorProps {
    content: any;
    onUpdate: (content: any, textContent: string) => void;
    placeholder?: string;
    editable?: boolean;
    saving?: boolean;
    lastSaved?: Date | null;
}

// 🎓 LEARNING: Enhanced MenuBar with proper TypeScript and better UX
const MenuBar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) return null;

    // 🎓 LEARNING: Button configuration for maintainable toolbar
    const toolbarButtons = [
        {
            icon: Bold,
            label: "Bold",
            action: () => editor.chain().focus().toggleBold().run(),
            isActive: () => editor.isActive("bold"),
            shortcut: "Ctrl+B"
        },
        {
            icon: Italic,
            label: "Italic",
            action: () => editor.chain().focus().toggleItalic().run(),
            isActive: () => editor.isActive("italic"),
            shortcut: "Ctrl+I"
        },
        {
            icon: Strikethrough,
            label: "Strikethrough",
            action: () => editor.chain().focus().toggleStrike().run(),
            isActive: () => editor.isActive("strike"),
            shortcut: "Ctrl+Shift+X"
        },
        {
            icon: Code,
            label: "Code",
            action: () => editor.chain().focus().toggleCode().run(),
            isActive: () => editor.isActive("code"),
            shortcut: "Ctrl+E"
        },
        {
            icon: Heading1,
            label: "Heading 1",
            action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
            isActive: () => editor.isActive("heading", { level: 1 }),
            shortcut: "Ctrl+Alt+1"
        },
        {
            icon: Heading2,
            label: "Heading 2",
            action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            isActive: () => editor.isActive("heading", { level: 2 }),
            shortcut: "Ctrl+Alt+2"
        },
        {
            icon: List,
            label: "Bullet List",
            action: () => editor.chain().focus().toggleBulletList().run(),
            isActive: () => editor.isActive("bulletList"),
            shortcut: "Ctrl+Shift+8"
        },
        {
            icon: ListOrdered,
            label: "Numbered List",
            action: () => editor.chain().focus().toggleOrderedList().run(),
            isActive: () => editor.isActive("orderedList"),
            shortcut: "Ctrl+Shift+7"
        },
        {
            icon: Quote,
            label: "Quote",
            action: () => editor.chain().focus().toggleBlockquote().run(),
            isActive: () => editor.isActive("blockquote"),
            shortcut: "Ctrl+Shift+B"
        }
    ];

    return (
        <div className="editor-toolbar border-b border-gray-200 p-2 flex flex-wrap gap-1">
            {toolbarButtons.map((button, index) => {
                const Icon = button.icon;
                return (
                    <button
                        key={index}
                        onClick={button.action}
                        className={`
                            p-2 rounded-md transition-colors duration-150 flex items-center justify-center
                            hover:bg-gray-100 
                            ${button.isActive()
                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                : 'text-gray-600 hover:text-gray-800'
                            }
                        `}
                        title={`${button.label} (${button.shortcut})`}
                        type="button"
                    >
                        <Icon className="h-4 w-4" />
                    </button>
                );
            })}
        </div>
    );
};


// 🎓 LEARNING: Word count and reading time helper functions
const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

const getReadingTime = (wordCount: number): number => {
    // Average reading speed: 200 words per minute
    return Math.ceil(wordCount / 200);
};

const TiptapEditor: React.FC<TiptapEditorProps> = ({
    content,
    onUpdate,
    placeholder = "Start writing...",
    editable = true,
    saving = false,
    lastSaved = null
}) => {
    // 🎓 LEARNING: Enhanced editor with additional extensions
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5, 6], // Allow all heading levels
                },
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            })
        ],
        content: content || '',
        editable,
        onUpdate: ({ editor }) => {
            // 🎓 LEARNING: Extract JSON content for JSONB storage
            const json = editor.getJSON();
            const text = editor.getText();
            console.log("📝 TiptapEditor: Content updated", {
                textLength: text.length,
                hasContent: !!json?.content?.length,
                jsonStructure: json
            });
            onUpdate(json, text);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
                placeholder: placeholder,
            },
        },
    });

    // 🎓 LEARNING: Get statistics from editor content
    const text = editor?.getText() || '';
    const wordCount = getWordCount(text);
    const readingTime = getReadingTime(wordCount);
    const characterCount = text.length;

    // 🎓 LEARNING: Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (editor) {
                editor.destroy();
            }
        };
    }, [editor]);

    if (!editor) {
        return (
            <div className="border border-gray-300 rounded-lg p-4">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-none">
            {/* 🎓 LEARNING: Enhanced container with better spacing and visual hierarchy */}
            <div className="tiptap-editor-container bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

                {/* Toolbar Section */}
                {editable && (
                    <div className="editor-header bg-gray-50/80 border-b border-gray-200">
                        <MenuBar editor={editor} />
                    </div>
                )}

                {/* Main Editor Content */}
                <div className="editor-content-wrapper">
                    <EditorContent editor={editor} />
                </div>

                {/* Enhanced Statistics Footer */}
                <div className="editor-footer bg-gray-50/50 border-t border-gray-200 px-4 py-2.5">
                    <div className="flex items-center justify-between">
                        {/* Document Statistics */}
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                                <span className="font-medium">{wordCount}</span>
                                <span className="text-gray-500">words</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-medium">{characterCount}</span>
                                <span className="text-gray-500">characters</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-medium">{readingTime}</span>
                                <span className="text-gray-500">min read</span>
                            </div>
                        </div>

                        {/* Save Status */}
                        {editable && (
                            <div className="flex items-center gap-2 text-sm">
                                {saving ? (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        <span className="text-blue-700 font-medium">Saving...</span>
                                    </div>
                                ) : lastSaved ? (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-green-700 font-medium">
                                            Saved at {lastSaved.toLocaleTimeString()}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-green-700 font-medium">Auto-saved</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TiptapEditor;