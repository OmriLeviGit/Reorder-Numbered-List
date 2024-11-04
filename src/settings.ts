import { App, PluginSettingTab, Setting } from "obsidian";
import AutoRenumbering from "../main";
import "./styles.css";

export default class AutoRenumberingSettings extends PluginSettingTab {
    plugin: AutoRenumbering;

    constructor(app: App, plugin: AutoRenumbering) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        new Setting(containerEl)
            .setName("Live update")
            .setDesc("Automatically update numbered lists as changes are made. Does not support Vim.")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.getSettings().liveUpdate).onChange(async (value) => {
                    this.plugin.setLiveUpdate(value);
                    await this.plugin.saveSettings();
                    smartPasteToggleEl.classList.toggle("smart-paste-toggle", value);
                    smartPasteToggleEl.classList.toggle("smart-paste-toggle-disabled", !value);
                })
            );

        const smartPasteSetting = new Setting(containerEl)
            .setName("Smart paste")
            .setDesc("Pasting keeps the sequencing consistent with the original numbered list.")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.getSettings().smartPaste).onChange(async (value) => {
                    this.plugin.setSmartPaste(value);
                    await this.plugin.saveSettings();
                })
            );

        const smartPasteToggleEl = smartPasteSetting.settingEl;
        const isLiveUpdateEnabled = this.plugin.getSettings().liveUpdate;
        smartPasteToggleEl.classList.add(isLiveUpdateEnabled ? "smart-paste-toggle" : "smart-paste-toggle-disabled");

        new Setting(containerEl)
            .setName("Tab indent size")
            .setDesc(
                "Set the indent size to the same size as in the editor's settings. Can be found under: Options > Editor > Tab indent size."
            )
            .addSlider((slider) => {
                slider
                    .setValue(this.plugin.getSettings().indentSize)
                    .setLimits(2, 8, 1)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.setIndentSize(value);
                        await this.plugin.saveSettings();
                    });
            });
    }
}
