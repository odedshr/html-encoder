const assert = require('assert');
const { NodeParser } = require('../../../dist/html-encoder');

describe('html-encoder-json: html-to-json', () => {
	it('get empty function',
		() => {
			const nodeParser = new NodeParser('');
			assert.strictEqual(nodeParser.getFunctions(), '');
		});
});
