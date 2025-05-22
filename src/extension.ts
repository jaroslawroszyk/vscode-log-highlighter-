import * as vscode from 'vscode';
import { escapeRegExp, randomColor } from './utils/utils';

interface Highlight {
	word: string;
	color: string;
	ignoreCase: boolean;
}

const highlights: { [key: string]: vscode.TextEditorDecorationType } = {};
let storedHighlights: Highlight[] = [];

const popularColors = [
	{ label: 'Red', color: '#FF0000' },
	{ label: 'Blue', color: '#0000FF' },
	{ label: 'Green', color: '#008000' },
	{ label: 'Pink', color: '#FFC0CB' },
	{ label: 'Yellow', color: '#FFFF00' },
	{ label: 'Orange', color: '#FFA500' },
	{ label: 'Purple', color: '#800080' },
	{ label: 'Light Gray', color: '#D3D3D3' }
];

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "log-highlighter" is now active!');

	storedHighlights = context.globalState.get<Highlight[]>('storedHighlights', []);

	const editor = vscode.window.activeTextEditor;
	if (editor) {
		applyHighlights(editor);
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.highlightSelection', () => {
			handleAddHighlight(context, vscode.window.activeTextEditor, false, false);
		}),
		vscode.commands.registerCommand('extension.addHighlightIgnoreCase', () => {
			handleAddHighlight(context, vscode.window.activeTextEditor, true, false);
		}),
		vscode.commands.registerCommand('extension.highlightWithCustomColor', () => {
			handleAddHighlight(context, vscode.window.activeTextEditor, false, true);
		}),
		vscode.commands.registerCommand('extension.removeHighlight', () => {
			handleRemoveHighlight(context, vscode.window.activeTextEditor);
		}),
		vscode.commands.registerCommand('extension.removeAllHighlights', () => {
			handleRemoveAllHighlights(context, vscode.window.activeTextEditor);
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			const activeEditor = vscode.window.activeTextEditor;
			if (activeEditor && event.document === activeEditor.document) {
				applyHighlights(activeEditor);
			}
		})
	);

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor) {
				applyHighlights(editor);
			}
		})
	);
}

export function deactivate() {
	for (const key in highlights) {
		highlights[key].dispose();
	}
}

async function handleAddHighlight(
	context: vscode.ExtensionContext,
	editor: vscode.TextEditor | undefined,
	ignoreCase: boolean,
	customColor: boolean
) {
	if (!editor) {
		vscode.window.showInformationMessage('No active editor');
		return;
	}
	const selection = editor.selection;
	const selectedTextRaw = editor.document.getText(selection).trim();
	if (!selectedTextRaw) {
		vscode.window.showInformationMessage('No text selected');
		return;
	}

	const exists = storedHighlights.some(h =>
		h.word === selectedTextRaw && h.ignoreCase === ignoreCase
	);
	if (exists) {
		vscode.window.showInformationMessage(`"${selectedTextRaw}" is already highlighted with ignoreCase=${ignoreCase}`);
		return;
	}

	let bgColor = randomColor();
	if (customColor) {
		const picked = await vscode.window.showQuickPick(
			popularColors.map(c => c.label).concat(['Custom color (hex)']),
			{ placeHolder: 'Select a highlight color or pick "Custom color (hex)" to enter manually' }
		);

		if (!picked) {
			return;
		}

		if (picked === 'Custom color (hex)') {
			const inputColor = await vscode.window.showInputBox({
				prompt: 'Enter a hex color code (e.g. #ff0000)',
				validateInput: (text) => {
					if (text && !/^#([0-9A-Fa-f]{6})$/.test(text)) {
						return 'Please enter a valid hex color like #ff0000';
					}
					return null;
				}
			});
			if (!inputColor) {
				return;
			}
			bgColor = inputColor;
		} else {
			const found = popularColors.find(c => c.label === picked);
			if (found) {
				bgColor = found.color;
			}
		}
	}

	storedHighlights.push({ word: selectedTextRaw, color: bgColor, ignoreCase });
	await context.globalState.update('storedHighlights', storedHighlights);

	applyHighlights(editor);

	vscode.window.showInformationMessage(`Highlighted: "${selectedTextRaw}"${ignoreCase ? ' (ignore case)' : ''} with color ${bgColor}`);
}

function applyHighlights(editor: vscode.TextEditor) {
	for (const key in highlights) {
		highlights[key].dispose();
		delete highlights[key];
	}

	const text = editor.document.getText();

	for (const highlight of storedHighlights) {
		const flags = highlight.ignoreCase ? 'gi' : 'g';
		const regex = new RegExp(`\\b${escapeRegExp(highlight.word)}\\b`, flags);

		const ranges: vscode.Range[] = [];
		let match;
		while ((match = regex.exec(text))) {
			const startPos = editor.document.positionAt(match.index);
			const endPos = editor.document.positionAt(match.index + match[0].length);
			ranges.push(new vscode.Range(startPos, endPos));
		}

		const decorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: highlight.color,
			color: '#000000',
			borderRadius: '2px',
			fontWeight: 'bold'
		});

		highlights[highlight.word + (highlight.ignoreCase ? '_i' : '')] = decorationType;
		editor.setDecorations(decorationType, ranges);
	}
}

async function handleRemoveHighlight(context: vscode.ExtensionContext, editor: vscode.TextEditor | undefined) {
	if (!editor) {
		vscode.window.showInformationMessage('No active editor');
		return;
	}
	const selection = editor.selection;
	const selectedTextRaw = editor.document.getText(selection).trim();
	if (!selectedTextRaw) {
		vscode.window.showInformationMessage('No text selected');
		return;
	}

	const idx = storedHighlights.findIndex(h => h.word === selectedTextRaw);
	if (idx === -1) {
		vscode.window.showInformationMessage(`No highlight found for "${selectedTextRaw}"`);
		return;
	}

	const highlight = storedHighlights[idx];
	const key = highlight.word + (highlight.ignoreCase ? '_i' : '');

	if (highlights[key]) {
		highlights[key].dispose();
		delete highlights[key];
	}

	storedHighlights.splice(idx, 1);
	await context.globalState.update('storedHighlights', storedHighlights);

	applyHighlights(editor);

	vscode.window.showInformationMessage(`Removed highlight: "${selectedTextRaw}"`);
}

async function handleRemoveAllHighlights(context: vscode.ExtensionContext, editor: vscode.TextEditor | undefined) {
	for (const key in highlights) {
		highlights[key].dispose();
		delete highlights[key];
	}
	storedHighlights = [];
	await context.globalState.update('storedHighlights', storedHighlights);

	if (editor) {
		applyHighlights(editor);
	}

	vscode.window.showInformationMessage('Removed all highlights');
}

// function randomColor(): string {
// 	const colors = ['#ffff99', '#ffcccb', '#ccffcc', '#ccccff', '#ffcc99'];
// 	return colors[Math.floor(Math.random() * colors.length)];
// }

// function escapeRegExp(string: string): string {
// 	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// }
