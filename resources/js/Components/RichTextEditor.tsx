import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Minus, Link as LinkIcon, Image as ImageIcon,
    Undo, Redo,
} from 'lucide-react';

interface Props {
    value: string;
    onChange: (html: string) => void;
}

const btn = (active = false) =>
    `rounded p-1.5 text-sm transition-colors ${active
        ? 'bg-violet-600/30 text-violet-300'
        : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`;

export default function RichTextEditor({ value, onChange }: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-violet-400 underline' } }),
            Image.configure({ HTMLAttributes: { class: 'max-w-full rounded-lg my-4' } }),
            Placeholder.configure({ placeholder: 'Start writing your post…' }),
        ],
        content: value,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: {
            attributes: {
                class: 'prose-blog min-h-[400px] focus:outline-none p-4',
            },
        },
    });

    if (!editor) return null;

    const setLink = () => {
        const prev = editor.getAttributes('link').href ?? '';
        const url = window.prompt('URL', prev);
        if (url === null) return;
        if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const insertImage = () => {
        const url = window.prompt('Image URL');
        if (url) editor.chain().focus().setImage({ src: url }).run();
    };

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-900 overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-0.5 border-b border-gray-700 bg-gray-800 px-2 py-2">
                <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn()} title="Undo"><Undo className="h-4 w-4" /></button>
                <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn()} title="Redo"><Redo className="h-4 w-4" /></button>
                <div className="mx-1 w-px bg-gray-700" />
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive('heading', { level: 1 }))} title="H1"><Heading1 className="h-4 w-4" /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))} title="H2"><Heading2 className="h-4 w-4" /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive('heading', { level: 3 }))} title="H3"><Heading3 className="h-4 w-4" /></button>
                <div className="mx-1 w-px bg-gray-700" />
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="Bold"><Bold className="h-4 w-4" /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="Italic"><Italic className="h-4 w-4" /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))} title="Strikethrough"><Strikethrough className="h-4 w-4" /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={btn(editor.isActive('code'))} title="Inline code"><Code className="h-4 w-4" /></button>
                <div className="mx-1 w-px bg-gray-700" />
                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))} title="Bullet list"><List className="h-4 w-4" /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))} title="Ordered list"><ListOrdered className="h-4 w-4" /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))} title="Blockquote"><Quote className="h-4 w-4" /></button>
                <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn()} title="Divider"><Minus className="h-4 w-4" /></button>
                <div className="mx-1 w-px bg-gray-700" />
                <button type="button" onClick={setLink} className={btn(editor.isActive('link'))} title="Link"><LinkIcon className="h-4 w-4" /></button>
                <button type="button" onClick={insertImage} className={btn()} title="Image"><ImageIcon className="h-4 w-4" /></button>
            </div>

            {/* Editor area */}
            <EditorContent editor={editor} />
        </div>
    );
}
