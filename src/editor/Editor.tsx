import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoCompletePlugin } from '../plugins/AutoCompletePlugin';
import { AutoCompleteEntryNode } from '../nodes/AutoCompleteEntryNode';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';

const editorConfig = {
  namespace: 'Editor',
  nodes: [AutoCompleteEntryNode],
  // Handling of errors during update
  onError(error: Error) {
    throw error;
  },
  // The editor theme
  theme: {
    ltr: 'ltr',
    paragraph: 'editor-paragraph',
    rtl: 'rtl',
    autoCompleteEntry: 'autocomplete-entry',
  },
};

type EditorParams = {
  isFunMode: boolean;
};

export default function Editor({ isFunMode }: EditorParams) {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-input"
                suppressContentEditableWarning
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <AutoCompletePlugin isFunMode={isFunMode} />
        </div>
      </div>
    </LexicalComposer>
  );
}
