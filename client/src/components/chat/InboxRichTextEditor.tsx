/**
 * Rich text editor for the inbox composer with emoji support.
 * Uses ReactQuill with quill-emoji module for emoji picker and shortname autocomplete.
 */
import { useRef, useEffect, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// quill-emoji imports
import 'quill-emoji/dist/quill-emoji.css';
import * as Emoji from 'quill-emoji';

// Register quill-emoji modules with Quill
Quill.register('modules/emoji', Emoji);

interface InboxRichTextEditorProps {
    /** Current HTML value */
    value: string;
    /** Called when content changes */
    onChange: (value: string) => void;
    /** Called when Enter is pressed (without Shift) */
    onSubmit?: () => void;
    /** Placeholder text */
    placeholder?: string;
    /** Whether the editor is in internal/private note mode */
    isInternal?: boolean;
    /** Whether canned response picker is open (disables Enter submit) */
    cannedPickerOpen?: boolean;
}

/**
 * InboxRichTextEditor - A compact rich text editor for message composition.
 * Features: Bold, Italic, Link, Emoji picker, :shortname: autocomplete
 */
export function InboxRichTextEditor({
    value,
    onChange,
    onSubmit,
    placeholder = 'Type your reply...',
    isInternal = false,
    cannedPickerOpen = false
}: InboxRichTextEditorProps) {
    const quillRef = useRef<ReactQuill>(null);

    // Custom keyboard bindings for Enter to send
    const modules = useMemo(() => ({
        toolbar: {
            container: [
                ['bold', 'italic', 'underline'],
                ['link'],
                ['emoji']
            ]
        },
        'emoji-toolbar': true,
        'emoji-shortname': true,
        keyboard: {
            bindings: {
                // Override Enter to submit (unless Shift is held or canned picker is open)
                enter: {
                    key: 13,
                    handler: function (this: { quill: { root: HTMLElement } }) {
                        // We'll handle this via the onKeyDown event instead for more control
                        return true;
                    }
                }
            }
        }
    }), []);

    const formats = useMemo(() => [
        'bold', 'italic', 'underline', 'link', 'emoji'
    ], []);

    // Handle Enter key for submit behavior
    useEffect(() => {
        const editor = quillRef.current?.getEditor();
        if (!editor) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey && !cannedPickerOpen && onSubmit) {
                e.preventDefault();
                e.stopPropagation();
                onSubmit();
            }
        };

        editor.root.addEventListener('keydown', handleKeyDown);
        return () => {
            editor.root.removeEventListener('keydown', handleKeyDown);
        };
    }, [onSubmit, cannedPickerOpen]);

    return (
        <div className={`inbox-rich-editor ${isInternal ? 'internal-mode' : ''}`}>
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
            />
            <style>{`
                /* Compact inbox editor styling */
                .inbox-rich-editor .ql-container {
                    border: none !important;
                    font-size: 14px;
                    font-family: inherit;
                }
                .inbox-rich-editor .ql-editor {
                    min-height: 80px;
                    max-height: 200px;
                    overflow-y: auto;
                    padding: 0;
                }
                .inbox-rich-editor .ql-editor.ql-blank::before {
                    font-style: normal;
                    color: #9ca3af;
                    left: 0;
                }
                .inbox-rich-editor .ql-toolbar {
                    border: none !important;
                    border-top: 1px solid #e5e7eb !important;
                    padding: 8px 0 0 0;
                    margin-top: 8px;
                }
                .inbox-rich-editor .ql-toolbar .ql-formats {
                    margin-right: 8px;
                }
                .inbox-rich-editor .ql-toolbar button {
                    width: 28px;
                    height: 28px;
                    padding: 4px;
                }
                .inbox-rich-editor .ql-toolbar button:hover {
                    background: #f3f4f6;
                    border-radius: 4px;
                }
                
                /* Internal/Private note mode - yellow tint */
                .inbox-rich-editor.internal-mode .ql-editor {
                    background: transparent;
                }
                .inbox-rich-editor.internal-mode .ql-editor.ql-blank::before {
                    color: rgba(202, 138, 4, 0.5);
                }
                
                /* Emoji picker positioning */
                #emoji-palette {
                    position: absolute;
                    bottom: 100%;
                    left: 0;
                    z-index: 50;
                }
                .emoji-picker {
                    z-index: 50 !important;
                }
                
                /* Emoji autocomplete dropdown */
                .ql-emoji-completions {
                    position: absolute !important;
                    bottom: 100% !important;
                    top: auto !important;
                    z-index: 50;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    max-height: 200px;
                    overflow-y: auto;
                }
            `}</style>
        </div>
    );
}
