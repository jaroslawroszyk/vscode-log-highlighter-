import * as vscode from 'vscode';
import { HighlightManager } from '../core/highlightManager';

export class EventRegistrator {
    private readonly context: vscode.ExtensionContext;
    private readonly highlightManager: HighlightManager;

    constructor(context: vscode.ExtensionContext, highlightManager: HighlightManager) {
        this.context = context;
        this.highlightManager = highlightManager;
    }

    registerAll() {
        this.context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(e => {
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor && e.document === activeEditor.document) {
                    this.highlightManager.applyHighlights(activeEditor);
                }
            }),

            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor) {
                    this.highlightManager.applyHighlights(editor);
                    this.highlightManager.updateHighlightContext(editor.selection, editor.document);
                }
            }),

            vscode.window.onDidChangeTextEditorSelection(event => {
                this.highlightManager.updateHighlightContext(event.selections[0], event.textEditor.document);
            }),

            { dispose: () => this.highlightManager.disposeAll() }
        );
    }
}
