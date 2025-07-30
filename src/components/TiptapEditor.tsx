import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "../styles/editor.css";

interface TiptapEditorProps {
    content: any;
    onUpdate: (content: any) => void;
}

const MenuBar= ({ editor }: any) => {
    if (!editor) return null;

    return (
        <div className="gap-3" >
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive("bold") ? "is-active" : ""}
            >
                Bold
            </button>
            {" "}
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive("italic") ? "is-active" : ""}
            >
                Italic
            </button>
            {" "}
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
            >
                H1
            </button>
            {" "}
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive("bulletList") ? "is-active" : ""}
            >
                List
            </button>
        </div>
    );
};


export const TiptapEditor: React.FC<TiptapEditorProps> = ({content, onUpdate}) => {
    const editor = useEditor({
        // add features you want
        extensions: [StarterKit,],
        content: content,
        onUpdate: ({editor}) => {
            const json = editor.getJSON();
            onUpdate(json);
        }
    });

    return (
        <div>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}