import { EditorConfig, NodeKey, TextNode, SerializedTextNode } from 'lexical';

type SerializedAutoCompleteEntryNode = Omit<
  SerializedTextNode,
  'type' | 'version'
> & {
  type: 'autocomplete-entry';
  version: 1;
};

export class AutoCompleteEntryNode extends TextNode {
  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  static getType(): string {
    return 'autocomplete-entry';
  }

  static clone(node: AutoCompleteEntryNode): AutoCompleteEntryNode {
    return new AutoCompleteEntryNode(node.getTextContent(), node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.style.color = 'blue';
    return dom;
  }
  //Copy
  exportJSON(): SerializedAutoCompleteEntryNode {
    const json = super.exportJSON() as SerializedTextNode;
    return {
      ...json,
      type: 'autocomplete-entry',
      version: 1,
      style: this.__style || 'color: blue;',
    };
  }

  //Paste
  static importJSON(
    serializedNode: SerializedAutoCompleteEntryNode
  ): AutoCompleteEntryNode {
    const node = new AutoCompleteEntryNode(serializedNode.text);
    if (serializedNode.style) {
      node.__style = serializedNode.style;
    }
    return node;
  }

  isEditable(): boolean {
    return false;
  }
}
