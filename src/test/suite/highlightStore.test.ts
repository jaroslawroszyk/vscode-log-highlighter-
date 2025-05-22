import * as assert from 'assert';
import { ExtensionContext } from 'vscode';
import { Highlight } from '../../types';
import * as highlightStore from '../../HighlightStore';

const mockContext = {
  globalState: {
    get: <T>(key: string, defaultValue: T): T => defaultValue,
    update: async () => undefined
  }
} as unknown as ExtensionContext;

suite('Highlight Store Tests', () => {
  const testHighlight: Highlight = {
    word: 'test',
    color: '#ff0000',
    ignoreCase: true
  };

  test('initialize store', () => {
    highlightStore.initHighlightStore(mockContext);
    assert.deepStrictEqual(highlightStore.getHighlights(), []);
  });

  test('add highlight', async () => {
    await highlightStore.addHighlight(testHighlight);
    const highlights = highlightStore.getHighlights();
    assert.strictEqual(highlights.length, 1);
    assert.deepStrictEqual(highlights[0], testHighlight);
  });

  test('remove highlight', async () => {
    await highlightStore.removeHighlight(h => h.word === 'test');
    const highlights = highlightStore.getHighlights();
    assert.strictEqual(highlights.length, 0);
  });

  test('clear highlights', async () => {
    await highlightStore.addHighlight(testHighlight);
    await highlightStore.clearHighlights();
    assert.strictEqual(highlightStore.getHighlights().length, 0);
  });
});
