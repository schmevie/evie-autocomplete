import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_BACKSPACE_COMMAND,
  KEY_DOWN_COMMAND,
  LexicalEditor,
  TextNode,
} from 'lexical';
import { AutoCompleteEntryNode } from '../../nodes/AutoCompleteEntryNode';
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

interface Rectangle {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
  x: number;
  y: number;
}

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

const makeOptionsFun = function (options: Array<string>) {
  const funTags = [
    `ya filthy animal!`,
    `it's giving`,
    `that's what she said`,
    `and that's showbiz, baby 🎭`,
    `in this economy? 💸`,
    `in the group chat™`,
    `written and directed by Greta Gerwig`,
    `zero notes`,
    `just like mom used to yell`,
    `and my therapist said that's progress`,
    `straight to voicemail`,
    `circling back aggressively`,
    `per my last email`,
    `added to the roadmap (and my nightmares)`,
    `.pending legal approval`,
    `And this meeting could've been an email`,
    `that's above my pay grade`,
    `just waiting on sign-off`,
    `hope this helps`,
    `the client won't notice`,
    `sent from my iPhone`,
    `looks fine on my machine`,
    `to infinity and beyond`,
    `you got it, dude`,
    `As if`,
  ];

  return options.map(option => {
    const randomNumber = Math.floor(Math.random() * funTags.length);
    const funTag = funTags[randomNumber];
    if (randomNumber === 1) {
      return `${funTag} ${option}`;
    }
    return `${option} ${funTag}`;
  });
};

const $textNodeTransform = async function (
  node: TextNode,
  editor: LexicalEditor,
  setAutoCompleteOptions: Dispatch<SetStateAction<string[]>>,
  setRectangle: Dispatch<SetStateAction<Rectangle | undefined>>,
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

    //INPUT SANITIZATION
    const invalidCharRegex = /[^a-zA-Z0-9 ']/g;
    if (invalidCharRegex.test(matchString)) {
      const sanitizedString = matchString.replace(invalidCharRegex, '');
      const firstHalfString = text.split('<>');
      if (firstHalfString.length > 0) {
        const constructedString = firstHalfString[0] + '<>' + sanitizedString;
        node.setTextContent(constructedString);
        node.select(node.getTextContentSize());
        matchString = sanitizedString;
      }
    }

    //FETCH AUTO COMPLETE OPTIONS
    if (matchString === '') {
      setAutoCompleteOptions([]);
      isLoadingOptionsRef.current = false;
    } else {
      debouncedFetchSuggestions(matchString);
    }

    //SET AUTOCOMPLETE BOX COORDINATES
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
  setRectangle: Dispatch<SetStateAction<Rectangle | undefined>>,
  isLoadingOptionsRef: React.RefObject<boolean>,
  targetAutoCompleteNodeRef: React.RefObject<TextNode | undefined>,
  lastHandledMatchRef: React.RefObject<{ key: string; match: string } | null>,
  isFunMode: boolean
): void {
  //Use debouncing to get rid of multiple api calls on fast typing
  const debouncedFetchSuggestions = useDebouncedCallback(
    async (matchString: string) => {
      isLoadingOptionsRef.current = true;
      const getAutoCompleteOptionsFromApi =
        await getAutoCompleteSuggestionsMuse({
          autoCompleteWord: matchString,
        });

      if (isFunMode) {
        const funOptions = makeOptionsFun(
          getAutoCompleteOptionsFromApi.options
        );
        setAutoCompleteOptions(funOptions);
      } else {
        setAutoCompleteOptions(getAutoCompleteOptionsFromApi.options);
      }
      isLoadingOptionsRef.current = false;
    },
    250 // delay in ms
  );

  useEffect(() => {
    if (!editor.hasNodes([AutoCompleteEntryNode])) {
      throw new Error(
        'AutoComplete Plugin: AutoCompleteEntryNote not registered'
      );
    }

    //REGISTER EVENTS/TRANSFORMS ON EDITOR - called once
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

    editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          const anchor = selection.anchor;
          const selectedNode = anchor.getNode();
          if (selectedNode.getType() === 'autocomplete-entry') {
            editor.update(() => {
              const newTextNode = $createTextNode(' ');
              selectedNode.replace(newTextNode);
            });
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          const anchor = selection.anchor;
          const selectedNode = anchor.getNode();

          if (
            selectedNode.getType() === 'autocomplete-entry' &&
            selection.isCollapsed()
          ) {
            if (event.key === ' ') {
              //TODO - Adds an extra whitespace should trim
              const newTextNode = $createTextNode(' ');
              selectedNode.insertAfter(newTextNode);
              newTextNode.select();
              return true;
            }
            const allowed = ['Backspace', ' ', 'ArrowRight', 'ArrowLeft'];
            if (!allowed.includes(event.key)) {
              event.preventDefault();
              return true;
            }
          }
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [
    editor,
    debouncedFetchSuggestions,
    setAutoCompleteOptions,
    setRectangle,
    targetAutoCompleteNodeRef,
    lastHandledMatchRef,
    isLoadingOptionsRef,
  ]);
};

type AutoCompletePluginParams = {
  isFunMode: boolean;
};

export const AutoCompletePlugin = function ({
  isFunMode,
}: AutoCompletePluginParams): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<string[]>([]);
  const [rectangle, setRectangle] = useState<Rectangle | undefined>(undefined);
  const targetAutoCompleteNodeRef = useRef<TextNode | undefined>(undefined);
  const isLoadingOptionsRef = useRef<boolean>(false);
  const lastHandledMatchRef = useRef<{ key: string; match: string } | null>(
    null
  );

  //SET USE EFFECT()
  useAutoComplete(
    editor,
    setAutoCompleteOptions,
    setRectangle,
    isLoadingOptionsRef,
    targetAutoCompleteNodeRef,
    lastHandledMatchRef,
    isFunMode
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

        const targetNodeText = targetNode.getTextContent();
        const targetNodeIndex = targetNodeText.indexOf('<>');

        if (targetNodeIndex === -1) return;

        const [left, rightPortion] = targetNode.splitText(targetNodeIndex);

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
            if (value === '') {
              value = right.getTextContent();
            }
            right.remove();
            const autoCompleteEntryNode = $createAutoCompleteEntryNode(value);
            middle.replace(autoCompleteEntryNode);
            const newTextNode = $createTextNode(' ');
            autoCompleteEntryNode.insertAfter(newTextNode);
            newTextNode.select();
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
          const autoCompleteEntryNode = $createAutoCompleteEntryNode(
            right.getTextContent()
          );
          middle.replace(autoCompleteEntryNode);
          const newTextNode = $createTextNode(' ');
          autoCompleteEntryNode.insertAfter(newTextNode);
          newTextNode.select();
          right.remove();
          return;
        }

        //something<>hello
        const autoCompleteEntryNode = $createAutoCompleteEntryNode(value);
        middle.replace(autoCompleteEntryNode);
        const newTextNode = $createTextNode(' ');
        autoCompleteEntryNode.insertAfter(newTextNode);
        newTextNode.select();
        right.remove();
      });
    },
    [editor]
  );

  const $createAutoCompleteEntryNode = function (
    text: string
  ): AutoCompleteEntryNode {
    return new AutoCompleteEntryNode(text);
  };

  return rectangle ? (
    <AutoCompleteBox
      options={autoCompleteOptions}
      rectangle={rectangle}
      onUpdateSelected={handleUpdateSelected}
      isLoadingRef={isLoadingOptionsRef}
    />
  ) : null;
};
