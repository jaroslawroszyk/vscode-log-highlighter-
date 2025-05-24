import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { CommandRegistrator } from '../../commands/CommandRegistrator';
import { HighlightManager } from '../../core/highlightManager';

suite('CommandRegistrator', () => {
    let context: vscode.ExtensionContext;
    let highlightManager: sinon.SinonStubbedInstance<HighlightManager>;
    let disposables: vscode.Disposable[];

    setup(() => {
        disposables = [];
        context = { subscriptions: disposables } as unknown as vscode.ExtensionContext;
        highlightManager = sinon.createStubInstance(HighlightManager);
    });

    teardown(() => {
        sinon.restore();
    });

    test('should register all commands and call highlightManager methods', () => {
        const registrator = new CommandRegistrator(context, highlightManager as unknown as HighlightManager);
        registrator.registerAll();

        sinon.assert.match(disposables.length, 5);

        const registerCommandStub = sinon.stub(vscode.commands, 'registerCommand').callsFake((command, callback) => {
            callback();
            return { dispose: () => { } };
        });

        registrator.registerAll();

        sinon.assert.calledWith(highlightManager.handleAddHighlight, vscode.window.activeTextEditor, false, false);
        sinon.assert.calledWith(highlightManager.handleAddHighlight, vscode.window.activeTextEditor, true, false);
        sinon.assert.calledWith(highlightManager.handleAddHighlight, vscode.window.activeTextEditor, false, true);
        sinon.assert.calledWith(highlightManager.handleRemoveHighlight, vscode.window.activeTextEditor);
        sinon.assert.calledWith(highlightManager.handleRemoveAllHighlights, vscode.window.activeTextEditor);

        registerCommandStub.restore();
    });
});
