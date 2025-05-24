import * as vscode from 'vscode';
import { escapeRegExp, randomColor } from '../utils/utils';
import { popularColors } from '../colors/colors';
import { HighlightStore } from './highlightStore';

export class HighlightManager {
	private static readonly MSG_NO_ACTIVE_EDITOR = 'No active editor';
	private static readonly MSG_NO_TEXT_SELECTED = 'No text selected';

	private highlightStore: HighlightStore;
	private decorations: Map<string, vscode.TextEditorDecorationType> = new Map();

	constructor(highlightStore: HighlightStore) {
		this.highlightStore = highlightStore;
	}

	async init() {
		try {
			await this.highlightStore.init();
		} catch (error) {
			console.error('Failed to initialize HighlightStore', error);
		}
	}

	async handleAddHighlight(
		editor: vscode.TextEditor | undefined,
		ignoreCase: boolean,
		customColor: boolean
	): Promise<void> {
		try {
			if (!editor) {
				vscode.window.showInformationMessage(HighlightManager.MSG_NO_ACTIVE_EDITOR);
				return;
			}

			const selectedTextRaw = editor.document.getText(editor.selection).trim();
			if (!selectedTextRaw) {
				vscode.window.showInformationMessage(HighlightManager.MSG_NO_TEXT_SELECTED);
				return;
			}

			const exists = this.highlightStore.getHighlights()
				.some(h => h.word === selectedTextRaw && h.ignoreCase === ignoreCase);

			if (exists) {
				vscode.window.showInformationMessage(
					`"${selectedTextRaw}" is already highlighted (ignoreCase=${ignoreCase})`
				);
				return;
			}

			let bgColor = randomColor();

			if (customColor) {
				const picked = await vscode.window.showQuickPick(
					[...popularColors.map(c => c.label), 'Custom color (hex)'],
					{ placeHolder: 'Select a highlight color or pick "Custom color (hex)"' }
				);

				if (!picked) { return; }

				if (picked === 'Custom color (hex)') {
					const inputColor = await vscode.window.showInputBox({
						prompt: 'Enter a hex color code (e.g. #ff0000)',
						validateInput: text => text && !/^#([0-9A-Fa-f]{6})$/.test(text)
							? 'Please enter a valid hex color like #ff0000' : null
					});
					if (!inputColor) { return; }
					bgColor = inputColor;
				} else {
					const found = popularColors.find(c => c.label === picked);
					if (found) { bgColor = found.color; }
				}
			}

			await this.highlightStore.addHighlight({ word: selectedTextRaw, color: bgColor, ignoreCase });
			this.applyHighlights(editor);

			vscode.window.showInformationMessage(`Highlighted "${selectedTextRaw}"${ignoreCase ? ' (ignore case)' : ''} with ${bgColor}`);

		} catch (error) {
			console.error('Error in handleAddHighlight:', error);
			vscode.window.showErrorMessage('Failed to add highlight. See console for details.');
		}
	}

	applyHighlights(editor: vscode.TextEditor): void {
		this.decorations.forEach(d => d.dispose());
		this.decorations.clear();

		const text = editor.document.getText();

		for (const highlight of this.highlightStore.getHighlights()) {
			const flags = highlight.ignoreCase ? 'gi' : 'g';
			const regex = new RegExp(`\\b${escapeRegExp(highlight.word)}\\b`, flags);

			const ranges: vscode.Range[] = [];
			let match: RegExpExecArray | null;
			while ((match = regex.exec(text)) !== null) {
				const start = editor.document.positionAt(match.index);
				const end = editor.document.positionAt(match.index + match[0].length);
				ranges.push(new vscode.Range(start, end));
			}

			if (ranges.length === 0) {
				continue;
			}

			const decorationType = vscode.window.createTextEditorDecorationType({
				backgroundColor: highlight.color,
				color: '#000000',
				borderRadius: '2px',
				fontWeight: 'bold',
			});

			const key = highlight.word + (highlight.ignoreCase ? '_i' : '');
			this.decorations.set(key, decorationType);
			editor.setDecorations(decorationType, ranges);
		}
	}

	async handleRemoveHighlight(editor: vscode.TextEditor | undefined): Promise<void> {
		try {
			if (!editor) {
				vscode.window.showInformationMessage(HighlightManager.MSG_NO_ACTIVE_EDITOR);
				return;
			}

			const selectedTextRaw = editor.document.getText(editor.selection).trim();
			if (!selectedTextRaw) {
				vscode.window.showInformationMessage(HighlightManager.MSG_NO_TEXT_SELECTED);
				return;
			}

			const highlights = this.highlightStore.getHighlights();
			const highlight = highlights.find(h => h.word === selectedTextRaw);

			if (!highlight) {
				vscode.window.showInformationMessage(`No highlight found for "${selectedTextRaw}"`);
				return;
			}

			await this.highlightStore.removeHighlight(h => h.word === selectedTextRaw);

			const key = highlight.word + (highlight.ignoreCase ? '_i' : '');
			const decoration = this.decorations.get(key);
			if (decoration) {
				decoration.dispose();
				this.decorations.delete(key);
			}

			this.applyHighlights(editor);
			vscode.window.showInformationMessage(`Removed highlight: "${selectedTextRaw}"`);

		} catch (error) {
			console.error('Error in handleRemoveHighlight:', error);
			vscode.window.showErrorMessage('Failed to remove highlight. See console for details.');
		}
	}

	async handleRemoveAllHighlights(editor: vscode.TextEditor | undefined): Promise<void> {
		try {
			this.decorations.forEach(d => d.dispose());
			this.decorations.clear();

			await this.highlightStore.clearHighlights();

			if (editor) { this.applyHighlights(editor); }

			vscode.window.showInformationMessage('Removed all highlights');

		} catch (error) {
			console.error('Error in handleRemoveAllHighlights:', error);
			vscode.window.showErrorMessage('Failed to remove all highlights. See console for details.');
		}
	}

	updateHighlightContext(selection: vscode.Selection, document: vscode.TextDocument): void {
		const selectedText = document.getText(selection).trim();
		if (!selectedText) {
			vscode.commands.executeCommand('setContext', 'highlightPlus.isHighlighted', false);
			return;
		}

		const isHighlighted = this.highlightStore.getHighlights().some(h => {
			return h.ignoreCase
				? h.word.toLowerCase() === selectedText.toLowerCase()
				: h.word === selectedText;
		});

		vscode.commands.executeCommand('setContext', 'highlightPlus.isHighlighted', isHighlighted);
	}

	disposeAll(): void {
		this.decorations.forEach(d => d.dispose());
		this.decorations.clear();
	}
}
