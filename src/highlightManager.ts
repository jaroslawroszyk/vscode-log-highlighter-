import * as vscode from 'vscode';
import { escapeRegExp, randomColor } from './utils/utils';
import { popularColors } from './colors';
import * as highlightStore from './HighlightStore';

const highlights: { [key: string]: vscode.TextEditorDecorationType } = {};

export function init(context: vscode.ExtensionContext) {
	highlightStore.initHighlightStore(context);
}

export async function handleAddHighlight(
	editor: vscode.TextEditor | undefined,
	ignoreCase: boolean,
	customColor: boolean
) {
	try {
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

		const highlightsList = highlightStore.getHighlights();
		const exists = highlightsList.some(h =>
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

			if (!picked) { return; }

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
				if (!inputColor) { return; }
				bgColor = inputColor;
			} else {
				const found = popularColors.find(c => c.label === picked);
				if (found) { bgColor = found.color; }
			}
		}

		await highlightStore.addHighlight({ word: selectedTextRaw, color: bgColor, ignoreCase });
		applyHighlights(editor);

		vscode.window.showInformationMessage(`Highlighted: "${selectedTextRaw}"${ignoreCase ? ' (ignore case)' : ''} with color ${bgColor}`);
	} catch (err) {
		console.error(err);
		vscode.window.showErrorMessage(`Failed to add highlight: ${(err as Error).message}`);
	}
}

export function applyHighlights(editor: vscode.TextEditor) {
	for (const key in highlights) {
		highlights[key].dispose();
		delete highlights[key];
	}

	const text = editor.document.getText();
	const highlightsList = highlightStore.getHighlights();

	for (const highlight of highlightsList) {
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

		const key = highlight.word + (highlight.ignoreCase ? '_i' : '');
		highlights[key] = decorationType;
		editor.setDecorations(decorationType, ranges);
	}
}

export async function handleRemoveHighlight(editor: vscode.TextEditor | undefined) {
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

	const highlightsList = highlightStore.getHighlights();
	const idx = highlightsList.findIndex(h => h.word === selectedTextRaw);
	if (idx === -1) {
		vscode.window.showInformationMessage(`No highlight found for "${selectedTextRaw}"`);
		return;
	}

	const highlight = highlightsList[idx];
	const key = highlight.word + (highlight.ignoreCase ? '_i' : '');

	await highlightStore.removeHighlight(h => h.word === selectedTextRaw);
	if (highlights[key]) {
		highlights[key].dispose();
		delete highlights[key];
	}

	applyHighlights(editor);

	vscode.window.showInformationMessage(`Removed highlight: "${selectedTextRaw}"`);
}

export async function handleRemoveAllHighlights(editor: vscode.TextEditor | undefined) {
	for (const key in highlights) {
		highlights[key].dispose();
		delete highlights[key];
	}

	await highlightStore.clearHighlights();

	if (editor) { applyHighlights(editor); }

	vscode.window.showInformationMessage('Removed all highlights');
}

export function updateHighlightContext(selection: vscode.Selection, document: vscode.TextDocument) {
	const selectedText = document.getText(selection).trim();
	if (!selectedText) {
		vscode.commands.executeCommand('setContext', 'highlightPlus.isHighlighted', false);
		return;
	}

	const highlights = getHighlights();
	const isHighlighted = highlights.some(h => {
		if (h.ignoreCase) {
			return h.word.toLowerCase() === selectedText.toLowerCase();
		}
		return h.word === selectedText;
	});

	vscode.commands.executeCommand('setContext', 'highlightPlus.isHighlighted', isHighlighted);
}

export function getHighlights() {
	return highlightStore.getHighlights();
}

export function disposeAll() {
	for (const key in highlights) {
		highlights[key].dispose();
	}
}
