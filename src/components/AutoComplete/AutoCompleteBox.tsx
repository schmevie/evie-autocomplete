import { JSX, useEffect, useState, useRef } from "react";
import styles from './styles.module.css';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_LOW, KEY_ENTER_COMMAND } from "lexical";

type AutoCompleteBoxParams = {
    options: string[],
    rectangle: {
        top: number,
        left: number,
        x: number,
        y: number
    };
    onUpdateSelected: (value: string) => void;
    isLoadingRef: React.RefObject<boolean>;
}

export default function AutoCompleteBox({options, rectangle, onUpdateSelected, isLoadingRef}: AutoCompleteBoxParams): JSX.Element | null {
    if (!rectangle) return null;
    
    const [editor] = useLexicalComposerContext();
    const [selectedString, setSelectedString] = useState<string>();
    const selectedStringRef = useRef(selectedString);
    const optionsRef = useRef(options);

    if (!editor || !rectangle) return null;

    const left = rectangle.left;
    const top = rectangle.y + 15;

    const handleEnterCommand = function (event: KeyboardEvent): boolean {
        const selected = selectedStringRef.current;

        if (optionsRef.current.length === 0 || !selected) {
            onUpdateSelected('');
            event.preventDefault();
            return true; // handled, so no further processing
        }
          
        onUpdateSelected(selected);
        event.preventDefault();
        return true;
    };

    useEffect(() => {
        if (options.length > 0) {
            selectedStringRef.current = options[0];
            setSelectedString(() => options[0]);
        }
        optionsRef.current = options;
    }, [options]);


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
                return handleEnterCommand(event);
            },
            COMMAND_PRIORITY_LOW
          );
        
          return () => {
            unregisterEnterCommand(); // Clean up old command
            //unregisterEnterComman()
            //unregisterSpaceCommand();
          };
    }, [editor, onUpdateSelected]);

    return (
        <div className={styles.autoCompleteBox} style={{top: `${top}px`, left: `${left}px`}}>
            {options.length > 0 && 
                <ul>
                    {options.map((word, i) => (
                        <li onClick={() =>{
                            onUpdateSelected(word);
                        }} className={i === 0 ? 'selected': ''} key={i}>{word}</li>
                    ))}
                </ul>
            }
            {(isLoadingRef.current === true)  &&
                <p>LOADING</p>
            }
            {isLoadingRef.current === false &&
             options.length === 0 &&
                <p>NO SUGGESTIONS FOUND</p>
            }
        </div>
    );
} 