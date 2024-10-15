import { Editor, EditorChange } from "obsidian";
import { getItemNum, getListStart, PATTERN } from "./utils";

interface PendingChanges {
    changes: EditorChange[];
    endIndex: number;
}

export default class Renumberer {
    constructor() {}

    applyChangesToEditor(editor: Editor, changes: EditorChange[]) {
        const changesApplied = changes.length > 0;

        if (changesApplied) {
            editor.transaction({ changes });
        }
        changes.splice(0, changes.length);

        return changesApplied;
    }

    renumberListAtCursor = (editor: Editor, changes: EditorChange[]) => {
        const { anchor, head } = editor.listSelections()[0];
        const currLine = Math.min(anchor.line, head.line);
        changes.push(...this.renumberBlockStartingAtLine(editor, currLine).changes);
        this.applyChangesToEditor(editor, changes);
    };

    renumberAllListsInRange = (editor: Editor, changes: EditorChange[], currLine: number, end: number) => {
        while (currLine < end) {
            if (PATTERN.test(editor.getLine(currLine))) {
                const newChanges = this.renumberBlockStartingAtLine(editor, currLine);
                if (newChanges.endIndex > 0) {
                    changes.push(...newChanges.changes);
                    currLine = newChanges.endIndex;
                }
            }
            currLine++;
        }

        if (changes.length > 0) {
            this.applyChangesToEditor(editor, changes);
        }
    };

    renumberLocally(editor: Editor, startIndex: number): PendingChanges {
        const currNum = getItemNum(editor, startIndex);
        const changes: EditorChange[] = [];

        if (currNum === -1) {
            return { changes, endIndex: startIndex }; // not a part of a numbered list
        }

        const prevNum = getItemNum(editor, startIndex - 1);
        let expectedItemNum = prevNum + 1;
        let isFirstLine = false; // if it's not the first line in a numbered list, we match the number to the line above and check one extra time

        if (prevNum === -1) {
            expectedItemNum = currNum + 1;
            startIndex++;
            isFirstLine = true;
        }

        return this.generateChanges(editor, expectedItemNum, startIndex, true, isFirstLine);
    }

    private renumberBlockStartingAtLine(editor: Editor, currLine: number, listStartsFrom: number = -1): PendingChanges {
        const changes: EditorChange[] = [];
        const startIndex = getListStart(editor, currLine);

        if (startIndex < 0) {
            return { changes, endIndex: startIndex };
        }

        const expectedItemNum = listStartsFrom !== -1 ? listStartsFrom : getItemNum(editor, startIndex);
        return this.generateChanges(editor, expectedItemNum, startIndex);
    }

    private generateChanges(
        editor: Editor,
        expectedItemNum: number,
        currLine: number,
        isLocal = false,
        isFirstLine = true
    ): PendingChanges {
        const changes: EditorChange[] = [];
        const lastLine = editor.lastLine() + 1;
        while (currLine < lastLine) {
            console.log("current line: ", currLine);
            const lineText = editor.getLine(currLine);
            const match = lineText.match(PATTERN);

            if (!match) {
                break;
            }

            // if a change is required (expected != actual), push it to the changes list
            if (expectedItemNum !== parseInt(match[1])) {
                const newLineText = lineText.replace(match[0], `${expectedItemNum}. `);
                changes.push({
                    from: { line: currLine, ch: 0 },
                    to: { line: currLine, ch: lineText.length },
                    text: newLineText,
                });
            } else if (isLocal && !isFirstLine) {
                break; // ensures changes are made locally, not until the end of the block
            }

            isFirstLine = false;
            currLine++;
            expectedItemNum++;
        }

        return { changes, endIndex: currLine - 1 };
    }

    // private findNonSpaceIndex(line: string): number {
    //     let index = -1;
    //     const length = line.length;

    //     for (let i = 0; i < length; i++) {
    //         if (line[i] !== " ") {
    //             index = i;
    //             break;
    //         }
    //     }

    //     return index;
    // }
}
