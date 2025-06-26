import { JSX } from "react";

export default function AutoCompleteBox({ options }: { options: string[] }): JSX.Element | null {
    return (
        <div>
            {options.length > 0 ? (
                <ul>
                    {options.map((word, i) => (
                        <li key={i}> {word}</li>
                    ))}
                </ul>
            ) : (
                <p>No Suggestions</p>
            )}
            HELLO WORLD!!!
        </div>
    );
} 