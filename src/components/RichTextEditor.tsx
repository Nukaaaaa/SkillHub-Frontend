import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
    Bold,
    Italic,
    Link as LinkIcon,
    Code,
    List,
    ListOrdered,
    Quote,
    Code2,
    Undo,
    Redo
} from 'lucide-react';
import styles from './RichTextEditor.module.css';

// Initialize lowlight for code highlighting
const lowlight = createLowlight(common);

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // Disable default code block to use lowlight instead
            }),
            Link.configure({
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Начните писать...',
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className={styles.editorContainer}>
            <div className={styles.toolbar}>
                <div className={styles.toolGroup}>
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        disabled={!editor.can().chain().focus().toggleBold().run()}
                        className={`${styles.toolBtn} ${editor.isActive('bold') ? styles.active : ''}`}
                        title="Bold"
                    >
                        <Bold size={18} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        disabled={!editor.can().chain().focus().toggleItalic().run()}
                        className={`${styles.toolBtn} ${editor.isActive('italic') ? styles.active : ''}`}
                        title="Italic"
                    >
                        <Italic size={18} />
                    </button>
                    <button
                        onClick={setLink}
                        className={`${styles.toolBtn} ${editor.isActive('link') ? styles.active : ''}`}
                        title="Link"
                    >
                        <LinkIcon size={18} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        disabled={!editor.can().chain().focus().toggleCode().run()}
                        className={`${styles.toolBtn} ${editor.isActive('code') ? styles.active : ''}`}
                        title="Inline Code"
                    >
                        <Code size={18} />
                    </button>
                </div>

                <div className={styles.divider} />

                <div className={styles.toolGroup}>
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`${styles.toolBtn} ${editor.isActive('bulletList') ? styles.active : ''}`}
                        title="Bullet List"
                    >
                        <List size={18} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`${styles.toolBtn} ${editor.isActive('orderedList') ? styles.active : ''}`}
                        title="Ordered List"
                    >
                        <ListOrdered size={18} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`${styles.toolBtn} ${editor.isActive('blockquote') ? styles.active : ''}`}
                        title="Blockquote"
                    >
                        <Quote size={18} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        className={`${styles.toolBtn} ${editor.isActive('codeBlock') ? styles.active : ''}`}
                        title="Code Block"
                    >
                        <Code2 size={18} />
                    </button>
                </div>

                <div className={styles.divider} />

                <div className={styles.toolGroup}>
                    <button
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().chain().focus().undo().run()}
                        className={styles.toolBtn}
                        title="Undo"
                    >
                        <Undo size={18} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().chain().focus().redo().run()}
                        className={styles.toolBtn}
                        title="Redo"
                    >
                        <Redo size={18} />
                    </button>
                </div>
            </div>

            <EditorContent editor={editor} className={styles.content} />
        </div>
    );
};

export default RichTextEditor;
