import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { EventRegistrator } from '../../events/EventRegistrator';
import { HighlightManager } from '../../core/highlightManager';
import assert from 'assert';

suite('EventRegistrar', () => {
    let context: vscode.ExtensionContext;
    let highlightManager: sinon.SinonStubbedInstance<HighlightManager>;
    let disposables: vscode.Disposable[];

    let onDidChangeTextDocumentStub: sinon.SinonStub;
    let onDidChangeActiveTextEditorStub: sinon.SinonStub;
    let onDidChangeTextEditorSelectionStub: sinon.SinonStub;

    setup(() => {
        disposables = [];
        context = { subscriptions: disposables } as unknown as vscode.ExtensionContext;
        highlightManager = sinon.createStubInstance(HighlightManager);

        // Stub the VSCode event registration functions
        onDidChangeTextDocumentStub = sinon.stub(vscode.workspace, 'onDidChangeTextDocument').callsFake(handler => {
            disposables.push({ dispose: () => { } });
            handler({ document: {} } as vscode.TextDocumentChangeEvent);
            return { dispose: () => { } };
        });

        onDidChangeActiveTextEditorStub = sinon.stub(vscode.window, 'onDidChangeActiveTextEditor').callsFake(handler => {
            disposables.push({ dispose: () => { } });
            handler({ selection: new vscode.Selection(0, 0, 0, 0), document: {} } as vscode.TextEditor);
            return { dispose: () => { } };
        });

        onDidChangeTextEditorSelectionStub = sinon.stub(vscode.window, 'onDidChangeTextEditorSelection').callsFake(handler => {
            disposables.push({ dispose: () => { } });
            handler({
                selections: [new vscode.Selection(0, 0, 0, 0)],
                textEditor: { document: {} } as vscode.TextEditor,
                kind: undefined
            } as vscode.TextEditorSelectionChangeEvent);

            return { dispose: () => { } };
        });
    });

    teardown(() => {
        sinon.restore();
    });

    test('should register all events and call highlightManager methods', () => {
    const registrar = new EventRegistrator(context, highlightManager as unknown as HighlightManager);
    registrar.registerAll();

    assert.ok(disposables.length >= 4, 'Expected at least 4 disposables to be registered');

    sinon.assert.called(highlightManager.applyHighlights);
    sinon.assert.called(highlightManager.updateHighlightContext);
});
});
