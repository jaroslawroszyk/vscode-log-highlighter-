import * as vscode from 'vscode';
import * as highlightManager from './highlightManager';

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "log-highlighter" is now active!');
	highlightManager.init(context);

	const editor = vscode.window.activeTextEditor;
	if (editor) {
		highlightManager.applyHighlights(editor);
		highlightManager.updateHighlightContext(editor.selection, editor.document);
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.highlightSelection', () => {
			highlightManager.handleAddHighlight(vscode.window.activeTextEditor, false, false);
		}),
		vscode.commands.registerCommand('extension.addHighlightIgnoreCase', () => {
			highlightManager.handleAddHighlight(vscode.window.activeTextEditor, true, false);
		}),
		vscode.commands.registerCommand('extension.highlightWithCustomColor', () => {
			highlightManager.handleAddHighlight(vscode.window.activeTextEditor, false, true);
		}),
		vscode.commands.registerCommand('extension.removeHighlight', () => {
			highlightManager.handleRemoveHighlight(vscode.window.activeTextEditor);
		}),
		vscode.commands.registerCommand('extension.removeAllHighlights', () => {
			highlightManager.handleRemoveAllHighlights(vscode.window.activeTextEditor);
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			const activeEditor = vscode.window.activeTextEditor;
			if (activeEditor && event.document === activeEditor.document) {
				highlightManager.applyHighlights(activeEditor);
			}
		})
	);

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor) {
				highlightManager.applyHighlights(editor);
				highlightManager.updateHighlightContext(editor.selection, editor.document);
			}
		})
	);

	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection(event => {
			highlightManager.updateHighlightContext(event.selections[0], event.textEditor.document);
		})
	);
}

export function deactivate() {
	highlightManager.disposeAll();
}
