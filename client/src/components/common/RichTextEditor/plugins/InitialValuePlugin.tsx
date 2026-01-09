/**
 * InitialValuePlugin - Parses initial HTML value into Lexical state.
 */
import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes } from 'lexical';

interface InitialValuePluginProps {
    initialValue: string;
}

export function InitialValuePlugin({ initialValue }: InitialValuePluginProps) {
    const [editor] = useLexicalComposerContext();
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (hasInitialized.current || !initialValue) return;
        hasInitialized.current = true;

        editor.update(() => {
            const parser = new DOMParser();
            const dom = parser.parseFromString(initialValue, 'text/html');
            const nodes = $generateNodesFromDOM(editor, dom);

            const root = $getRoot();
            root.clear();
            $insertNodes(nodes);
        });
    }, [editor, initialValue]);

    return null;
}
