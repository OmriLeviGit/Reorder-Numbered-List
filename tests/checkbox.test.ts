import { createMockEditor } from "./__mocks__/createMockEditor";
import "./__mocks__/main";

import { getCheckboxEndIndex } from "src/checkbox";
import SettingsManager from "src/SettingsManager";

describe.only("getCheckboxEndIndex", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    const testCases = [
        {
            name: "Test with a single unchecked checkbox",
            content: ["- [ ] a"],
            index: 0,
            expected: undefined,
        },
        {
            name: "Test index 0 checked",
            content: ["- [x] a"],
            index: 0,
            expected: 0,
        },
        {
            name: "Test default",
            content: ["- [x] a", "- [x] b"],
            index: 0,
            expected: 0,
        },
        {
            name: "Should stop at the first checked checkbox",
            content: ["- [x] a", "- [ ] b", "- [x] c"],
            index: 0,
            expected: 1,
        },

        {
            name: "Should stop on text",
            content: ["- [x] a", "- [ ] b", "- [ ] c", "text"],
            index: 0,
            expected: 2,
        },
        {
            name: "Should stop before indent",
            content: ["- [x] a", "- [ ] b", "\t- [ ] c", "- [ ] d"],
            index: 0,
            expected: 1,
        },
        {
            name: "Test indented stop on checked",
            content: ["- [ ] a", "\t- [x] b", "\t- [ ] c", "\t- [x] d", "- [ ] e"],
            index: 1,
            expected: 2,
        },
        {
            name: "Test indented stop at the end of indentation",
            content: ["- [ ] a", "\t- [x] b", "\t- [ ] c", "- [ ] d"],
            index: 1,
            expected: 2,
        },
        {
            name: "Test indented stop at text on the same indentation",
            content: ["- [ ] a", "\t- [x] b", "\ttext", "\t- [ ] c", "- [ ] d"],
            index: 1,
            expected: 1,
        },
        {
            name: "Checkbox with numbering",
            content: ["1. [x] a"],
            index: 0,
            expected: 0,
        },
        {
            name: "Stop correctly in checked numbered checkboxes",
            content: ["1. [x] a", "2. [x] b"],
            index: 0,
            expected: 0,
        },
        {
            name: "Should stop at the first numbered and checked checkbox",
            content: ["1. [x] a", "2. [ ] b", "3. [x] c"],
            index: 0,
            expected: 1,
        },
        {
            name: "Should stop at checkbox that is not numbered",
            content: ["1. [x] a", "2. [ ] b", "- [ ] c", "3. [ ] c"],
            index: 0,
            expected: 1,
        },
        {
            name: "Should stop on numbered text",
            content: ["1. [x] a", "2. [ ] b", "3. c", "4. [ ] d"],
            index: 0,
            expected: 1,
        },
    ];

    testCases.forEach(({ name, content, index, expected }) => {
        test(name, () => {
            SettingsManager.getInstance().setSortCheckboxesBottom(false);
            const editor = createMockEditor(content);
            const res = getCheckboxEndIndex(editor, index);

            expect(res).toBe(expected);
        });
    });
});

// requires proper mock
// describe("moveLine", () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     const testCases = [
//         {
//             name: "Single Item",
//             content: ["a"],
//             index: 0,
//             insertTo: 0,
//             expected: ["a"],
//         },
//         {
//             name: "Sequence forward insert",
//             content: ["a", "b", "c", "d", "e"],
//             index: 1,
//             insertTo: 3,
//             expected: ["a", "c", "d", "b", "e"],
//         },
//         {
//             name: "Sequence backwards insert",
//             content: ["a", "b", "c", "d", "e"],
//             index: 3,
//             insertTo: 1,
//             expected: ["a", "d", "b", "c", "e"],
//         },
//         {
//             name: "Sequence from the end",
//             content: ["a", "b", "c", "d", "e"],
//             index: 4,
//             insertTo: 2,
//             expected: ["a", "d", "e", "c", "d"],
//         },
//         {
//             name: "Sequence from the end",
//             content: ["a", "b", "c", "d", "e"],
//             index: 2,
//             insertTo: 4,
//             expected: ["a", "d", "d", "e", "c"],
//         },
//     ];

//     testCases.forEach(({ name, content, index, insertTo, expected }) => {
//         test(name, () => {
//             const editor = createMockEditor(content);
//             moveLine(editor, index, insertTo);
//             expected.forEach((_, i) => {
//                 expect(editor.getLine(i)).toBe(expected[i]);
//             });
//         });
//     });
// });
