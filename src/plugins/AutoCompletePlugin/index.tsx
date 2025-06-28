import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createTextNode, LexicalEditor, TextNode } from 'lexical';
import {
  JSX,
  SetStateAction,
  useEffect,
  useState,
  Dispatch,
  useRef,
  useCallback,
} from 'react';
import AutoCompleteBox from '../../components/AutoComplete/AutoCompleteBox';
import getAutoCompleteSuggestionsMuse from '../../api/autoCompleteService';
import { useDebouncedCallback } from 'use-debounce';

const $findAndGetMatchString = function (text: string): null | string {
  let matchString: null | string = null;
  for (let i = 0; i < text.length; i++) {
    const autoCompleteCommand = text.slice(i, i + 2);
    if (autoCompleteCommand === '<>') {
      matchString = text.slice(i + 2, text.length);
    }
  }

  return matchString;
};

const $textNodeTransform = async function (
  node: TextNode,
  editor: LexicalEditor,
  setAutoCompleteOptions: Dispatch<SetStateAction<string[]>>,
  setRectangle: Dispatch<SetStateAction<any>>,
  targetAutoCompleteNodeRef: React.RefObject<TextNode | undefined>,
  lastHandledMatchRef: React.RefObject<{ key: string; match: string } | null>,
  isLoadingOptionsRef: React.RefObject<boolean>,
  debouncedFetchSuggestions: (matchString: string) => void
): Promise<void> {
  const text = node.getTextContent();
  let matchString = $findAndGetMatchString(text);

  if (
    matchString &&
    lastHandledMatchRef.current?.key === node.getKey() &&
    lastHandledMatchRef.current?.match === matchString
  ) {
    return;
  }

  targetAutoCompleteNodeRef.current = node;

  if (matchString !== null) {
    isLoadingOptionsRef.current = true;
    const invalidCharRegex = /[^a-zA-Z0-9 ]/g;
    if (invalidCharRegex.test(matchString)) {
      const cleaned = matchString.replace(invalidCharRegex, '');
      const firstHalfString = text.split('<>');
      if (firstHalfString.length > 0) {
        const constructedString = firstHalfString[0] + '<>' + cleaned;
        node.setTextContent(constructedString);
        node.select(node.getTextContentSize());
        matchString = cleaned;
      }
    }

    if (matchString === '') {
      setAutoCompleteOptions([]);
      isLoadingOptionsRef.current = false;
    } else {
      debouncedFetchSuggestions(matchString);
    }

    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const clientRects = range.getClientRects();
      if (clientRects.length > 0) {
        const rect = clientRects[0];
        const editorElem = editor.getRootElement();
        if (editorElem) {
          const editorRect = editorElem.getBoundingClientRect();
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
  } else {
    setRectangle(undefined);
    setAutoCompleteOptions([]);
    isLoadingOptionsRef.current = false;
  }
};

const useAutoComplete = function (
  editor: LexicalEditor,
  setAutoCompleteOptions: Dispatch<SetStateAction<string[]>>,
  setRectangle: Dispatch<SetStateAction<any>>,
  isLoadingOptionsRef: React.RefObject<boolean>,
  targetAutoCompleteNodeRef: React.RefObject<TextNode | undefined>,
  lastHandledMatchRef: React.RefObject<{ key: string; match: string } | null>
): void {
  //Use debouncing to get rid of multiple api calls on fast typing
  const debouncedFetchSuggestions = useDebouncedCallback(
    async (matchString: string) => {
      isLoadingOptionsRef.current = true;
      const getAutoCompleteOptionsFromApi =
        await getAutoCompleteSuggestionsMuse({ autoCompleteWord: matchString });
      setAutoCompleteOptions(getAutoCompleteOptionsFromApi.options);
      isLoadingOptionsRef.current = false;
    },
    250 // delay in ms
  );

  useEffect(() => {
    //NEED TO DEFINE NODE ONCE I CREATE IT
    // if (!editor.hasNodes([AutoCompleteNode])) {
    //     throw new Error('AutoComplete Plugin: AutoCompleteNote not registered');
    // }
    editor.registerNodeTransform(TextNode, (node: TextNode) => {
      $textNodeTransform(
        node,
        editor,
        setAutoCompleteOptions,
        setRectangle,
        targetAutoCompleteNodeRef,
        lastHandledMatchRef,
        isLoadingOptionsRef,
        debouncedFetchSuggestions
      );
    });
  }, [editor, debouncedFetchSuggestions]);
};

export const AutoCompletePlugin = function (): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<string[]>([]);
  const [rectangle, setRectangle] = useState<any>();
  const targetAutoCompleteNodeRef = useRef<TextNode | undefined>(undefined);
  const isLoadingOptionsRef = useRef<boolean>(false);
  const lastHandledMatchRef = useRef<{ key: string; match: string } | null>(
    null
  );

  useAutoComplete(
    editor,
    setAutoCompleteOptions,
    setRectangle,
    isLoadingOptionsRef,
    targetAutoCompleteNodeRef,
    lastHandledMatchRef
  );

  const handleUpdateSelected = useCallback(
    (value: string) => {
      if (isLoadingOptionsRef.current) return;

      editor.update(() => {
        const targetNode = targetAutoCompleteNodeRef.current;
        if (!targetNode) return;

        const match = $findAndGetMatchString(targetNode.getTextContent());
        if (match) {
          lastHandledMatchRef.current = { key: targetNode.getKey(), match };
        }

        const autoCommandText = targetNode.getTextContent();
        const autoCommandIndex = autoCommandText.indexOf('<>');

        if (autoCommandIndex === -1) return;

        const [left, rightPortion] = targetNode.splitText(autoCommandIndex);

        if (left && !rightPortion) {
          const [middle, right] = left.splitText(2);
          //<>
          if (middle && !right) {
            left.remove();
            setRectangle(undefined);
            setAutoCompleteOptions([]);
            return;
          }
          //<>hello
          if (middle && right) {
            middle.replace($createTextNode(right.getTextContent()));
            right.remove();
            setRectangle(undefined);
            setAutoCompleteOptions([]);
            return;
          }

          left.remove();
          setRectangle(undefined);
          setAutoCompleteOptions([]);
          return;
        }

        const [middle, right] = rightPortion.splitText(2);
        //something<>
        if (!right) {
          middle.remove();
          return;
        }

        //something<>**NO SUGGESTIONS**
        if (value === '') {
          middle.replace($createTextNode(right.getTextContent()));
          right.remove();
          return;
        }

        //something<>hello
        middle.replace($createTextNode(value));
        right.remove();
      });
    },
    [editor]
  );

  return rectangle ? (
    <AutoCompleteBox
      options={autoCompleteOptions}
      rectangle={rectangle}
      onUpdateSelected={handleUpdateSelected}
      isLoadingRef={isLoadingOptionsRef}
    />
  ) : null;
};
