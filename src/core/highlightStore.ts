import { ExtensionContext } from 'vscode';
import { Highlight } from './types';

export class HighlightStore {
	private storedHighlights: Highlight[] = [];
	private context: ExtensionContext;
	private storageKey = 'storedHighlights';

	constructor(context: ExtensionContext) {
		this.context = context;
	}

	async init(): Promise<void> {
		this.storedHighlights = this.context.globalState.get<Highlight[]>(this.storageKey, []);
	}

	getHighlights(): Highlight[] {
		return [...this.storedHighlights];
	}

	async addHighlight(h: Highlight): Promise<void> {
		this.storedHighlights.push(h);
		await this.save();
	}

	async removeHighlight(predicate: (h: Highlight) => boolean): Promise<void> {
		const originalLength = this.storedHighlights.length;
		this.storedHighlights = this.storedHighlights.filter(h => !predicate(h));
		if (this.storedHighlights.length !== originalLength) {
			await this.save();
		}
	}

	async clearHighlights(): Promise<void> {
		if (this.storedHighlights.length > 0) {
			this.storedHighlights = [];
			await this.save();
		}
	}

	private async save(): Promise<void> {
		await this.context.globalState.update(this.storageKey, this.storedHighlights);
	}
}
