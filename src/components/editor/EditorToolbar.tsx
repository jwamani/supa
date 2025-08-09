// 🎓 LEARNING: Enhanced Editor Toolbar Component
// This component provides a professional formatting toolbar for the TipTap editor

import React from 'react';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    List,
    ListOrdered,
    Quote,
    Code,
    Link,
    Image,
    Heading1,
    Heading2,
    Heading3,
    Undo,
    Redo,
    Type,
    Palette
} from 'lucide-react';
import Button from '../ui/Button';

export interface EditorToolbarProps {
    editor: any; // TipTap editor instance
    className?: string;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, className = '' }) => {
    if (!editor) {
        return null;
    }

    // 🎓 LEARNING: Toolbar button component for consistent styling
    const ToolbarButton: React.FC<{
        onClick: () => void;
        isActive?: boolean;
        disabled?: boolean;
        children: React.ReactNode;
        title: string;
    }> = ({ onClick, isActive = false, disabled = false, children, title }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`
        p-2 rounded-md transition-colors duration-200
        ${isActive
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
        ${disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
      `}
        >
            {children}
        </button>
    );

    return (
        <div className={`flex flex-wrap items-center gap-1 p-2 bg-white border-b border-gray-200 ${className}`}>
            {/* History Controls */}
            <div className="flex gap-1 mr-2 pr-2 border-r border-gray-200">
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo (Ctrl+Y)"
                >
                    <Redo className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Text Formatting */}
            <div className="flex gap-1 mr-2 pr-2 border-r border-gray-200">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="Underline (Ctrl+U)"
                >
                    <Underline className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="Strikethrough"
                >
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive('code')}
                    title="Inline Code"
                >
                    <Code className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Headings */}
            <div className="flex gap-1 mr-2 pr-2 border-r border-gray-200">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    isActive={editor.isActive('paragraph')}
                    title="Normal Text"
                >
                    <Type className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Text Alignment */}
            <div className="flex gap-1 mr-2 pr-2 border-r border-gray-200">
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    isActive={editor.isActive({ textAlign: 'left' })}
                    title="Align Left"
                >
                    <AlignLeft className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    isActive={editor.isActive({ textAlign: 'center' })}
                    title="Align Center"
                >
                    <AlignCenter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    isActive={editor.isActive({ textAlign: 'right' })}
                    title="Align Right"
                >
                    <AlignRight className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Lists and Quotes */}
            <div className="flex gap-1 mr-2 pr-2 border-r border-gray-200">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Numbered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Quote"
                >
                    <Quote className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Media and Links */}
            <div className="flex gap-1">
                <ToolbarButton
                    onClick={() => {
                        const url = window.prompt('Enter link URL:');
                        if (url) {
                            editor.chain().focus().setLink({ href: url }).run();
                        }
                    }}
                    isActive={editor.isActive('link')}
                    title="Insert Link"
                >
                    <Link className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => {
                        const url = window.prompt('Enter image URL:');
                        if (url) {
                            editor.chain().focus().setImage({ src: url }).run();
                        }
                    }}
                    title="Insert Image"
                >
                    <Image className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Text Color - Advanced Feature */}
            <div className="flex gap-1 ml-2 pl-2 border-l border-gray-200">
                <ToolbarButton
                    onClick={() => {
                        const color = window.prompt('Enter text color (e.g., #ff0000, red):');
                        if (color) {
                            editor.chain().focus().setColor(color).run();
                        }
                    }}
                    title="Text Color"
                >
                    <Palette className="w-4 h-4" />
                </ToolbarButton>
            </div>
        </div>
    );
};

export default EditorToolbar;
