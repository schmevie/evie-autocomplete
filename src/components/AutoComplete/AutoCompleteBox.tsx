import React, { JSX, useEffect, useRef, useState } from 'react';
import styles from './styles.module.css';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
} from 'lexical';

type AutoCompleteBoxParams = {
  options: string[];
  rectangle: {
    top: number;
    left: number;
    x: number;
    y: number;
  };
  onUpdateSelected: (value: string) => void;
  isLoadingRef: React.RefObject<boolean>;
};

export default function AutoCompleteBox({
  options,
  rectangle,
  onUpdateSelected,
  isLoadingRef,
}: AutoCompleteBoxParams): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const selectedStringRef = useRef('');
  const optionsRef = useRef(options);
  const selectedIndexRef = useRef(0);
  const itemRefs = useRef<{ [key: number]: any | null }>({});
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const boxRef = useRef<any>(null);

  useEffect(() => {
    if (options.length > 0) {
      selectedStringRef.current = options[0];
      selectedIndexRef.current = 0;
      setSelectedIndex(0);
    }
    optionsRef.current = options;
  }, [options, selectedIndexRef]);

  useEffect(() => {
    if (!editor) return;
    //ABSTRAC THIS INTO ITS OWN FUCNTION NEED TO HANDLE
    //UP AND DOWN
    //LEFT AND RIGHT + COMMAND SHIFT LEFT AND RIGHT MIGHT BE SAME THING
    //TAB
    //SPACE
    //CLICK OUTSIDE OF THE BOX
    const unregisterEnterCommand = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent) => {
        return handleSelectionCommands(event);
      },
      COMMAND_PRIORITY_LOW
    );

    const unregisterTabCommand = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event: KeyboardEvent) => {
        return handleSelectionCommands(event);
      },
      COMMAND_PRIORITY_LOW
    );

    const unregisterLeftArrowCommand = editor.registerCommand(
      KEY_ARROW_LEFT_COMMAND,
      (event: KeyboardEvent) => {
        return handleLeftArrowCommand(event);
      },
      COMMAND_PRIORITY_LOW
    );

    const unregisterUpArrowCommand = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event: KeyboardEvent) => {
        return handleUpArrowCommand(event);
      },
      COMMAND_PRIORITY_LOW
    );

    const unregisterDownArrowCommand = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        return handleDownArrowCommand(event);
      },
      COMMAND_PRIORITY_LOW
    );

    const handleClickOutside = function (event: any) {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        onUpdateSelected('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unregisterEnterCommand();
      document.removeEventListener('mousedown', handleClickOutside);
      unregisterLeftArrowCommand();
      unregisterTabCommand();
      unregisterUpArrowCommand();
      unregisterDownArrowCommand();
    };
  }, [editor, onUpdateSelected]);

  if (!rectangle || !editor) return null;

  const left = rectangle.left;
  const top = rectangle.y + 15;

  const handleSelectionCommands = function (event: KeyboardEvent): boolean {
    const selected = selectedStringRef.current;

    if (optionsRef.current.length === 0 || !selected) {
      onUpdateSelected('');
      event.preventDefault();
      return true;
    }

    onUpdateSelected(selected.trimEnd());
    event.preventDefault();
    return true;
  };

  const handleLeftArrowCommand = function (event: KeyboardEvent): boolean {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      console.log('helllo');
      const anchor = selection.anchor;
      const node = anchor.getNode();

      if ($isTextNode(node)) {
        const offset = anchor.offset;

        if (offset > 0) {
          const textContent = node.getTextContent();
          const charToLeft = textContent[offset - 1];

          if (charToLeft === '>') {
            event.preventDefault();
            return true;
          }
        }
      }
    }
    return false;
  };

  const handleUpArrowCommand = function (event: KeyboardEvent): boolean {
    event.preventDefault();
    if (selectedIndexRef.current - 1 < 0) return false;
    selectedIndexRef.current -= 1;

    const selectedIndex = selectedIndexRef.current;
    setSelectedIndex(selectedIndex);

    const listItem = itemRefs.current[selectedIndex];
    const previousItem = itemRefs.current[selectedIndex + 1];

    listItem.classList.add(styles.selected);
    previousItem.classList.remove(styles.selected);

    selectedStringRef.current = listItem.textContent;

    return false;
  };

  const handleDownArrowCommand = function (event: KeyboardEvent): boolean {
    event.preventDefault();
    if (selectedIndexRef.current + 1 >= optionsRef.current.length) return false;
    selectedIndexRef.current += 1;

    const selectedIndex = selectedIndexRef.current;
    setSelectedIndex(selectedIndex);

    const listItem = itemRefs.current[selectedIndex];
    const previousItem = itemRefs.current[selectedIndex - 1];
    listItem.classList.add(styles.selected);
    previousItem.classList.remove(styles.selected);

    selectedStringRef.current = listItem.textContent;

    return false;
  };

  console.log('LOADING REF', isLoadingRef.current);
  console.log('OPTIONS', options);
  return (
    <div
      ref={boxRef}
      className={styles.autoCompleteBox}
      style={{ top: `${top}px`, left: `${left}px` }}
    >
      {options.length > 0 && (
        <ul>
          {options.map((word, i) => (
            <li
              onClick={() => {
                onUpdateSelected(word);
              }}
              className={i === selectedIndex ? styles.selected : ''}
              ref={el => {
                itemRefs.current[i] = el;
              }}
              key={i}
            >
              {word}
            </li>
          ))}
        </ul>
      )}
      {isLoadingRef.current === true && <p>LOADING</p>}
      {isLoadingRef.current === false && options.length === 0 && (
        <p>NO SUGGESTIONS FOUND</p>
      )}
    </div>
  );
}
