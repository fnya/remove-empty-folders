import { App, Plugin, TFolder } from "obsidian";

export default class RemoveEmptyFoldersPlugin extends Plugin {
	async onload() {
		this.registerEvent(
			this.app.workspace.on("files-menu", (menu, files) => {
				menu.addItem((item) => {
					item.setTitle("Remove empty folders").onClick(async () => {
						files.forEach((file) => {
							if (file instanceof TFolder) {
								removeEmptyFolders(this.app, file);
							}
						});
					});
				});
			})
		);

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				menu.addItem((item) => {
					item.setTitle("Remove empty folders").onClick(async () => {
						if (file instanceof TFolder) {
							removeEmptyFolders(this.app, file);
						}
					});
				});
			})
		);
	}
}

const removeEmptyFolders = (app: App, folder: TFolder) => {
	folder.children.forEach((child) => {
		if (child instanceof TFolder) {
			removeEmptyFolders(app, child);
		}
	});

	if (folder.children.length === 0) {
		app.vault.adapter.trashLocal(folder.path);
	}
};
