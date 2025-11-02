import { App, Modal, Setting } from 'obsidian';
import { getAPI, Literal } from "obsidian-dataview";

export class NewHeatmapModal extends Modal {
  constructor(app: App, onSubmit: (result: any) => void) {
    super(app);

    this.setTitle('Create new Heatmap Tracker');

    let name = '';

    new Setting(this.contentEl)
      .setName('Name')
      .addText((text) =>
        text.onChange((value) => {
          name = value;
        }));

    const dv = getAPI(app);

    let props = new Set();

    for (let page of dv.pages()) {
      if (page.file.frontmatter) {
        for (let key of Object.keys(page.file.frontmatter)) {
          props.add(key);
        }
      }
    }

    let property = '';

    new Setting(this.contentEl)
      .setName('Property')
      .addDropdown((dropdown) => {
        dropdown.addOptions(Object.fromEntries([...props].map((p) => [p, p])));

        dropdown.onChange((value) => {
          property = value;
        });
      });

    new Setting(this.contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('Submit')
          .setCta()
          .onClick(() => {
            this.close();
            onSubmit({
              heatmapTitle: name,
              property: property
            });
          }));
  }
}