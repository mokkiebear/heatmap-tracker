import { App, Modal, Setting } from "obsidian";

export class ConfirmModal extends Modal {
	private message: string;
	private resolve!: (value: boolean) => void;

	constructor(app: App, message: string) {
		super(app);
		this.message = message;
	}

	async openAndAwait(): Promise<boolean> {
		return new Promise((resolve) => {
			this.resolve = resolve;
			this.open();
		});
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("p", { text: this.message });

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Confirm")
					.setCta()
					.onClick(() => {
						this.resolve(true);
						this.close();
					})
			)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => {
					this.resolve(false);
					this.close();
				})
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		// If the modal is closed without clicking a button (e.g. Esc), resolve with false
		this.resolve(false);
	}
}
