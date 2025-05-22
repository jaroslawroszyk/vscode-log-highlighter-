import * as assert from 'assert';
import { escapeRegExp, randomColor } from '../../utils/utils';

suite('Utility Function Tests', () => {
	test('escapeRegExp escapes special characters', () => {
		assert.strictEqual(escapeRegExp('a.b*c'), 'a\\.b\\*c');
		assert.strictEqual(escapeRegExp('[test]'), '\\[test\\]');
		assert.strictEqual(escapeRegExp('^$'), '\\^\\$');
	});

	test('randomColor returns a valid color', () => {
		const colors = ['#ffff99', '#ffcccb', '#ccffcc', '#ccccff', '#ffcc99'];
		const result = randomColor();
		assert.ok(colors.includes(result), `Unexpected color: ${result}`);
	});
});
