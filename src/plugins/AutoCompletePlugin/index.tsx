import { LexicalComposerContext, useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $createTextNode, EditorState, LexicalEditor, TextNode } from "lexical";
import { JSX, SetStateAction, useEffect, useRef, useState, Dispatch } from "react";
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

const $textNodeTransform = async function(node: TextNode, setAutoCompleteOptions: Dispatch<SetStateAction<string[]>>) : Promise<void> {
    let targetNode: TextNode = node;
    let text = targetNode.getTextContent();
    const matchString = $findAndGetMatchString(text);

    if (matchString !== null) {
        const getAutoCompleteOptionsFromApi = await getAutoCompleteSuggestionsMuse({autoCompleteWord: matchString});
        setAutoCompleteOptions(getAutoCompleteOptionsFromApi.options)
        //UPDATE HIDDEN DISPLAY AUTOCOMPLETE BOX COMPONENT
    }

    return;
};


const useAutoComplete = function(editor: LexicalEditor, setAutoCompleteOptions: Dispatch<SetStateAction<string[]>>) : void {
    useEffect(() => {
        //NEED TO DEFINE NODE ONCE I CREATE IT
        // if (!editor.hasNodes([AutoCompleteNode])) {
        //     throw new Error('AutoComplete Plugin: AutoCompleteNote not registered');
        // }

        editor.registerNodeTransform(TextNode, (node: TextNode) => {
            $textNodeTransform(node, setAutoCompleteOptions);
        });

    }, [editor, setAutoCompleteOptions])
};

export const AutoCompletePlugin = function() : JSX.Element  | null {
    const [editor] = useLexicalComposerContext();
    const [autoCompleteOptions, setAutoCompleteOptions] = useState<string []>([]);
    useAutoComplete(editor, setAutoCompleteOptions);

    return (
        <AutoCompleteBox
            options={autoCompleteOptions}
        />
    );
};