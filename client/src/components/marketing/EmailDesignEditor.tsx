
import React, { useRef, useState } from 'react';
import EmailEditor, { EditorRef } from 'react-email-editor';
// import { Button } from '../ui/button'; // Assuming we have UI components, or use native

interface Props {
    initialDesign?: any;
    onSave: (html: string, design: any) => void;
    onCancel: () => void;
}

export const EmailDesignEditor: React.FC<Props> = ({ initialDesign, onSave, onCancel }) => {
    const emailEditorRef = useRef<EditorRef>(null);
    const [loading, setLoading] = useState(true);

    const exportHtml = () => {
        const editor = emailEditorRef.current?.editor;
        if (!editor) return;

        editor.exportHtml((data) => {
            const { design, html } = data;
            onSave(html, design);
        });
    };

    const onLoad = () => {
        setLoading(false);
        // Editor is ready
        // You can load your custom template here?
        // initialDesign automatically handled by `initialDesign` prop? 
        // No, documentation says pass it generally or load it.
        // But the component supports `minHeight`, `style`, etc.
    };

    const onReady = () => {
        // editor is fully ready
        if (initialDesign && emailEditorRef.current?.editor) {
            emailEditorRef.current.editor.loadDesign(initialDesign);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white text-black relative">
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold">Email Editor</h2>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={exportHtml}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        Save Design
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative bg-gray-100">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white z-10 transition-opacity duration-300">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-medium">Loading Editor...</p>
                        </div>
                    </div>
                )}
                <EmailEditor
                    ref={emailEditorRef}
                    onLoad={onLoad}
                    onReady={onReady}
                    style={{ height: '100%', minHeight: '600px', display: 'flex' }}
                    options={{
                        appearance: {
                            theme: 'light',
                            panels: {
                                tools: {
                                    dock: 'left'
                                }
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
};
