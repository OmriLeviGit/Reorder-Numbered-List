import { Plugin, Editor, EditorChange } from "obsidian";
import { Mutex } from "async-mutex";
import { handlePaste } from "./src/paste-handler";
import { registerCommands } from "src/command-registration";
import Renumberer from "src/renumbering/Renumberer";
import AutoRenumberingSettings from "./src/settings-tab";
import SettingsManager, { DEFAULT_SETTINGS } from "src/SettingsManager";
import { dynamicStartStrategy, startFromOneStrategy } from "src/renumbering/renumbering-strategies";
import { RenumberingStrategy } from "src/types";

const mutex = new Mutex();

export default class AutoRenumbering extends Plugin {
    private renumberer: Renumberer;
    private settingsManager: SettingsManager;
    private changes: EditorChange[] = [];
    private isProccessing = false;
    private blockChanges = false; // if the previous action was a special key
    private handleKeystrokeBound: (event: KeyboardEvent) => void;

    async onload() {
        await this.loadSettings();
        registerCommands(this);
        this.addSettingTab(new AutoRenumberingSettings(this.app, this));
        this.settingsManager = SettingsManager.getInstance();

        if (this.settingsManager.getSettings().startsFromOne) {
            this.renumberer = new Renumberer(new startFromOneStrategy());
        } else {
            this.renumberer = new Renumberer(new dynamicStartStrategy());
        }

        // editor change
        this.registerEvent(
            this.app.workspace.on("editor-change", (editor: Editor) => {
                if (this.settingsManager.getSettings().liveUpdate === false) {
                    return;
                }
                if (!this.isProccessing) {
                    this.isProccessing = true;

                    setTimeout(() => {
                        mutex.runExclusive(() => {
                            if (this.blockChanges) {
                                return;
                            }

                            this.blockChanges = true;
                            const { anchor, head } = editor.listSelections()[0];
                            const currLine = Math.min(anchor.line, head.line);
                            this.changes.push(...this.renumberer.renumber(editor, currLine).changes);
                            this.renumberer.applyChangesToEditor(editor, this.changes);
                        });
                        this.isProccessing = false;
                    }, 0);
                }
            })
        );

        // paste
        this.registerEvent(
            this.app.workspace.on("editor-paste", (evt: ClipboardEvent, editor: Editor) => {
                if (this.settingsManager.getSettings().liveUpdate === false) {
                    return;
                }

                const clipboardContent = evt.clipboardData?.getData("text");

                if (evt.defaultPrevented || !clipboardContent) {
                    return;
                }

                evt.preventDefault();

                mutex.runExclusive(() => {
                    this.blockChanges = true;
                    const { baseIndex, offset } = handlePaste(editor, clipboardContent);
                    this.renumberer.allListsInRange(editor, this.changes, baseIndex, baseIndex + offset);
                    this.renumberer.applyChangesToEditor(editor, this.changes);
                });
            })
        );

        this.handleKeystrokeBound = this.handleKeystroke.bind(this);
        window.addEventListener("keydown", this.handleKeystrokeBound); // Keystroke listener
    }

    handleKeystroke(event: KeyboardEvent) {
        // if special key, dont renumber automatically
        mutex.runExclusive(() => {
            this.blockChanges = event.ctrlKey || event.metaKey || event.altKey;
            // console.debug("handlestroke", this.blockChanges);
        });
    }

    async onunload() {
        window.removeEventListener("keydown", this.handleKeystrokeBound);
    }

    async loadSettings() {
        const settingsManager = SettingsManager.getInstance();
        settingsManager.setSettings(Object.assign({}, DEFAULT_SETTINGS, await this.loadData()));
    }

    async saveSettings() {
        const settingsManager = SettingsManager.getInstance();
        await this.saveData(settingsManager.getSettings());
        console.log("settings: ", settingsManager.getSettings(), "strategy: ", this.renumberer);
    }

    getRenumberer() {
        return this.renumberer;
    }

    getIsProcessing() {
        return this.isProccessing;
    }

    getChanges() {
        return this.changes;
    }

    setIsProcessing(value: boolean) {
        this.isProccessing = value;
    }

    setStrategy(strategy: RenumberingStrategy) {
        this.renumberer.setStrategy(strategy);
    }
}
