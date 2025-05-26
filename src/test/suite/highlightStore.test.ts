import * as assert from 'assert';
import { ExtensionContext } from 'vscode';
import { Highlight } from '../../core/types';
import { HighlightStore } from '../../core/highlightStore';

const createMockContext = (): ExtensionContext => ({
  globalState: {
    storage: new Map<string, any>(),
    get<T>(key: string, defaultValue: T): T {
      if (this.storage.has(key)) {
        return this.storage.get(key);
      }
      return defaultValue;
    },
    update(key: string, value: any): Promise<void> {
      this.storage.set(key, value);
      return Promise.resolve();
    }
  }
} as unknown as ExtensionContext);

suite('HighlightStore Class Tests', () => {
  let store: HighlightStore;

  const testHighlight: Highlight = {
    word: 'test',
    color: '#ff0000',
    ignoreCase: true
  };

  setup(async () => {
    const mockContext = createMockContext();
    store = new HighlightStore(mockContext);
    await store.init();
  });

  test('initial state is empty', () => {
    assert.deepStrictEqual(store.getHighlights(), []);
  });

  test('addHighlight adds highlight', async () => {
    await store.addHighlight(testHighlight);
    const highlights = store.getHighlights();
    assert.strictEqual(highlights.length, 1);
    assert.deepStrictEqual(highlights[0], testHighlight);
  });

  test('removeHighlight removes correct highlight', async () => {
    await store.addHighlight(testHighlight);
    await store.removeHighlight(h => h.word === 'test');
    const highlights = store.getHighlights();
    assert.strictEqual(highlights.length, 0);
  });

  test('clearHighlights clears all highlights', async () => {
    await store.addHighlight(testHighlight);
    await store.clearHighlights();
    const highlights = store.getHighlights();
    assert.strictEqual(highlights.length, 0);
  });
});
