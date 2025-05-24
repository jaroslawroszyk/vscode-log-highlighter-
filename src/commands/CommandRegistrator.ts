import * as vscode from 'vscode';
import { HighlightManager } from '../core/highlightManager';

export class CommandRegistrator {
    private readonly context: vscode.ExtensionContext;
    private readonly highlightManager: HighlightManager;

    constructor(context: vscode.ExtensionContext, highlightManager: HighlightManager) {
        this.context = context;
        this.highlightManager = highlightManager;
    }

    registerAll() {
        this.register('extension.highlightSelection', () =>
            this.highlightManager.handleAddHighlight(vscode.window.activeTextEditor, false, false)
        );

        this.register('extension.addHighlightIgnoreCase', () =>
            this.highlightManager.handleAddHighlight(vscode.window.activeTextEditor, true, false)
        );

        this.register('extension.highlightWithCustomColor', () =>
            this.highlightManager.handleAddHighlight(vscode.window.activeTextEditor, false, true)
        );

        this.register('extension.removeHighlight', () =>
            this.highlightManager.handleRemoveHighlight(vscode.window.activeTextEditor)
        );

        this.register('extension.removeAllHighlights', () =>
            this.highlightManager.handleRemoveAllHighlights(vscode.window.activeTextEditor)
        );
    }

    private register(command: string, callback: (...args: any[]) => any) {
        const disposable = vscode.commands.registerCommand(command, callback);
        this.context.subscriptions.push(disposable);
    }
}
