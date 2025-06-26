import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {PlainTextPlugin} from '@lexical/react/LexicalPlainTextPlugin';
import { AutoCompletePlugin } from '../plugins/AutoCompletePlugin';


const editorConfig = {
    namespace: 'Editor',
    nodes: [],
    // Handling of errors during update
    onError(error: Error) {
        throw error;
    },
    // The editor theme
    theme: {
            ltr: 'ltr',
            paragraph: 'editor-paragraph',
            rtl: 'rtl',
        },
};

export default function Editor() {
    return (
        <LexicalComposer initialConfig={editorConfig}>
            <div className="editor-container">
                <div className="editor-inner">
                    <PlainTextPlugin
                        contentEditable={
                        <ContentEditable
                            className="editor-input"
                            suppressContentEditableWarning
                        />}
                        ErrorBoundary={LexicalErrorBoundary}

                    />
                    <HistoryPlugin />
                    <AutoFocusPlugin />
                    <AutoCompletePlugin/>
                </div>
            </div>
        </LexicalComposer>
    );
}