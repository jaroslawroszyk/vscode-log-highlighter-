// highlightStore.ts
import { ExtensionContext } from 'vscode';
import { Highlight } from './types';

let storedHighlights: Highlight[] = [];
let context: ExtensionContext | null = null;

export function initHighlightStore(ctx: ExtensionContext) {
	context = ctx;
	storedHighlights = ctx.globalState.get<Highlight[]>('storedHighlights', []);
}

export function getHighlights(): Highlight[] {
	return storedHighlights;
}

export async function addHighlight(h: Highlight) {
	storedHighlights.push(h);
	await save();
}

export async function removeHighlight(predicate: (h: Highlight) => boolean) {
	const idx = storedHighlights.findIndex(predicate);
	if (idx >= 0) {
		storedHighlights.splice(idx, 1);
		await save();
	}
}

export async function clearHighlights() {
	storedHighlights = [];
	await save();
}

async function save() {
	if (context) {
		await context.globalState.update('storedHighlights', storedHighlights);
	}
}
