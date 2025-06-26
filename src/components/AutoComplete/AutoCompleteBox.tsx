import { JSX, useEffect } from "react";
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
}

export default function AutoCompleteBox({options, rectangle}: AutoCompleteBoxParams): JSX.Element | null {
    if (!rectangle) return null;
    
    const [editor] = useLexicalComposerContext();

    if (!editor || !rectangle) return null;

    const left = rectangle.left;
    const top = rectangle.y + 15;

    useEffect(() => {
        editor.registerCommand(KEY_ENTER_COMMAND, (event: KeyboardEvent) => {
            console.log("ENTER HAPPENED");
            event.preventDefault();
            return true;
        }
        , COMMAND_PRIORITY_LOW)
    }, [editor]); 

    return (
        <div className={styles.autoCompleteBox} style={{top: `${top}px`, left: `${left}px`}}>
            {options.length > 0 ? (
                <ul>
                    {options.map((word, i) => (
                        <li key={i}>{word}</li>
                    ))}
                </ul>
            ) : (
                <p>No Suggestions</p>
            )}
            HELLO WORLD!!!
        </div>
    );
} 