import {  useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, LexicalEditor, TextNode, RangeSelection, $isRangeSelection } from "lexical";
import { JSX, SetStateAction, useEffect, useState, Dispatch, useRef } from "react";
import AutoCompleteBox from '../../components/AutoComplete/AutoCompleteBox';
import getAutoCompleteSuggestionsMuse from "../../api/autoCompleteService";


const $findAndGetMatchString = function(text: string) : null | string  {
    let matchString : null | string = null;
    for (let i = 0; i < text.length; i++) {
        const autoCompleteCommand = text.slice(i, i + 2);
        if (autoCompleteCommand === '<>') {
            matchString = text.slice(i + 2, text.length);
        }
    }

    return matchString;
}

const $textNodeTransform = async function(node: TextNode,
                                         setAutoCompleteOptions: Dispatch<SetStateAction<string[]>>,
                                         setRectangle: Dispatch<SetStateAction<any>>,
                                         editor: LexicalEditor
                                        )
                                          : Promise<void> {
    let targetNode: TextNode = node;
    let text = targetNode.getTextContent();
    const matchString = $findAndGetMatchString(text);

    if (matchString !== null) {
        const getAutoCompleteOptionsFromApi = await getAutoCompleteSuggestionsMuse({autoCompleteWord: matchString});
        setAutoCompleteOptions(getAutoCompleteOptionsFromApi.options);

        //Get Cursor and update the position, accounts for overflow in line
        const selection = window.getSelection();

        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const clientRects = range.getClientRects();
        
          if (clientRects.length > 0) {
            const rect = clientRects[0];
            const editorElem = editor.getRootElement();

            if (editorElem) {
              const editorRect = editorElem.getBoundingClientRect();
        
              // Offset the box to be relative to the editor
              const adjustedRect = {
                top: rect.top - editorRect.top,
                left: rect.left - editorRect.left,
                bottom: rect.bottom - editorRect.top,
                right: rect.right - editorRect.left,
                width: rect.width,
                height: rect.height,
                x: rect.x - editorRect.left,
                y: rect.y - editorRect.top,
              };
        
              setRectangle(adjustedRect);
            }
          }
        }
    }

    return;
};

const useAutoComplete = function(editor: LexicalEditor, 
                                setAutoCompleteOptions: Dispatch<SetStateAction<string[]>>,
                                setRectangle: Dispatch<SetStateAction<any>>
                            ) : void {
    useEffect(() => {
        //NEED TO DEFINE NODE ONCE I CREATE IT
        // if (!editor.hasNodes([AutoCompleteNode])) {
        //     throw new Error('AutoComplete Plugin: AutoCompleteNote not registered');
        // }

        editor.registerNodeTransform(TextNode, (node: TextNode) => {
            $textNodeTransform(node, setAutoCompleteOptions, setRectangle, editor);
        });

    }, [editor, setAutoCompleteOptions, setRectangle])
};

export const AutoCompletePlugin = function() : JSX.Element  | null {
    const [editor] = useLexicalComposerContext();
    const [autoCompleteOptions, setAutoCompleteOptions] = useState<string []>([]);
    const [rectangle, setRectangle] = useState<any>();

    useAutoComplete(editor, setAutoCompleteOptions, setRectangle);

    return rectangle ? (
        <AutoCompleteBox
            options={autoCompleteOptions}
            rectangle={rectangle}
        />
    ) : null;
};