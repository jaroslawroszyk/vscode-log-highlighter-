import * as vscode from 'vscode';
import { HighlightStore } from './core/highlightStore';
import { HighlightManager } from './core/highlightManager';

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

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.highlightSelection', () =>
			highlightManager.handleAddHighlight(vscode.window.activeTextEditor, false, false)
		),
		vscode.commands.registerCommand('extension.addHighlightIgnoreCase', () =>
			highlightManager.handleAddHighlight(vscode.window.activeTextEditor, true, false)
		),
		vscode.commands.registerCommand('extension.highlightWithCustomColor', () =>
			highlightManager.handleAddHighlight(vscode.window.activeTextEditor, false, true)
		),
		vscode.commands.registerCommand('extension.removeHighlight', () =>
			highlightManager.handleRemoveHighlight(vscode.window.activeTextEditor)
		),
		vscode.commands.registerCommand('extension.removeAllHighlights', () =>
			highlightManager.handleRemoveAllHighlights(vscode.window.activeTextEditor)
		)
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(e => {
			const activeEditor = vscode.window.activeTextEditor;
			if (activeEditor && e.document === activeEditor.document) {
				highlightManager.applyHighlights(activeEditor);
			}
		}),
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor) {
				highlightManager.applyHighlights(editor);
				highlightManager.updateHighlightContext(editor.selection, editor.document);
			}
		}),
		vscode.window.onDidChangeTextEditorSelection(event => {
			highlightManager.updateHighlightContext(event.selections[0], event.textEditor.document);
		}),
		{
			dispose: () => highlightManager.disposeAll()
		}
	);
}

export function deactivate() {
}
