const assert = require('assert');
const NodeParser = require('../../../out/html-to-json').default;

describe('html-encoder-json: html-to-json', () => {
	it('get empty function',
		() => {
			const nodeParser = new NodeParser('');
			assert.strictEqual(nodeParser.getFunctions(), '');
		});
});
