import { App, Notice, Plugin, TFolder } from "obsidian";

async function deleteFolder(app: App, folder: TFolder): Promise<boolean> {
	try {
		await app.vault.trash(folder, true);
		return true;
	} catch (e) {
		try {
			await app.vault.adapter.rmdir(folder.path, true);
			return true;
		} catch (err) {
			console.error(`Failed to remove empty folder: ${folder.path}`, err);
			return false;
		}
	}
}

function getAllSubfolders(folder: TFolder): TFolder[] {
	let list: TFolder[] = [];
	if (!folder || !folder.children) return list;
	for (const child of folder.children) {
		if (child instanceof TFolder) {
			list.push(child);
			list = list.concat(getAllSubfolders(child));
		}
	}
	return list;
}

async function removeEmptyFoldersRecursively(app: App, target: TFolder): Promise<number> {
	let totalDeleted = 0;
	let changed = true;
	let pass = 0;

	while (changed && pass < 20) {
		changed = false;
		pass++;

		const folders = getAllSubfolders(target);
		folders.sort((a, b) => {
			const depthA = a.path.split("/").length;
			const depthB = b.path.split("/").length;
			return depthB - depthA;
		});

		for (const folder of folders) {
			if (folder && folder.children && folder.children.length === 0) {
				const success = await deleteFolder(app, folder);
				if (success) {
					console.log(`[Remove Empty Folders] Removed: ${folder.path}`);
					totalDeleted++;
					changed = true;
				}
			}
		}
	}

	if (!target.isRoot() && target.children && target.children.length === 0) {
		const success = await deleteFolder(app, target);
		if (success) {
			console.log(`[Remove Empty Folders] Removed: ${target.path}`);
			totalDeleted++;
		}
	}

	return totalDeleted;
}

export default class RemoveEmptyFoldersPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: "remove-all-empty-folders",
			name: "Remove all empty folders in vault",
			callback: async () => {
				const notice = new Notice("Removing empty folders...");
				const root = this.app.vault.getRoot();
				const count = await removeEmptyFoldersRecursively(this.app, root);
				notice.hide();
				new Notice(`Removed ${count} empty folder(s)!`);
				console.log(`[Remove Empty Folders] Vault cleanup finished. Removed: ${count}`);
			},
		});

		this.registerEvent(
			this.app.workspace.on("files-menu", (menu, files) => {
				menu.addItem((item) => {
					item.setTitle("Remove empty folders").onClick(async () => {
						const notice = new Notice("Removing empty folders...");
						let count = 0;
						for (const file of files) {
							if (file instanceof TFolder) {
								count += await removeEmptyFoldersRecursively(this.app, file);
							}
						}
						notice.hide();
						new Notice(`Removed ${count} empty folder(s)!`);
						console.log(`[Remove Empty Folders] Finished. Removed: ${count}`);
					});
				});
			})
		);

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (file instanceof TFolder) {
					menu.addItem((item) => {
						item.setTitle("Remove empty folders").onClick(async () => {
							const notice = new Notice("Removing empty folders...");
							const count = await removeEmptyFoldersRecursively(this.app, file);
							notice.hide();
							new Notice(`Removed ${count} empty folder(s)!`);
							console.log(`[Remove Empty Folders] Finished. Removed: ${count}`);
						});
					});
				}
			})
		);
	}
}
