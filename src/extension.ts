import * as vscode from 'vscode';
import { HighlightStore } from './core/highlightStore';
import { HighlightManager } from './core/highlightManager';
import { CommandRegistrator } from './commands/CommandRegistrator';
import { EventRegistrator } from './events/EventRegistrator';

export async function activate(context: vscode.ExtensionContext) {
	console.log('Extension "log-highlighter" is now active!');

	const highlightStore = new HighlightStore(context);
	await highlightStore.init();

	const highlightManager = new HighlightManager(highlightStore);
	await highlightManager.init();

	const editor = vscode.window.activeTextEditor;
	if (editor) {
		highlightManager.applyHighlights(editor);
		highlightManager.updateHighlightContext(editor.selection, editor.document);
	}

	new CommandRegistrator(context, highlightManager).registerAll();
	new EventRegistrator(context, highlightManager).registerAll();
}

export function deactivate() { }
