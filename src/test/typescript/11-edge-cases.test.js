const assert = require('assert');
const { test, getNode, getTSString, getNodeFactory } = require('./utils.js');
const htmlEncoder = require('../../../out/html-encoder').default;

describe('html-encoder-typescript: edge-cases', () => {
	it('handles empty file', () => test('', {}, ''));

	it('handles invalid xml', () => test('<heading>Reminder</lala>', {}, '<heading></heading>Reminder'));

	it('handles data with illegal html chars', () => test('<div><?==text?></div>', { text: '&' }, '<div>&amp;</div>'));

	it('handles html-tags with illegal html chars', () =>
		test('<div><?==text?></div>', { text: '<b>a</b> & <i>b</i>' }, '<div><span><b>a</b> &amp; <i>b</i></span></div>'));

	//
	it('using the same #liveId for multiple targets', () => {
		const node = getNode(
			'<ul><li><input id="field"/><?attr value#liveId=text?></li><li><?==text #liveId?></li><li><?=text #liveId?></li></ul>',
			{ text: '<b>foo</b>' }
		);
		assert.strictEqual(
			node.toString(),
			'<ul><li><input id="field" value="&lt;b>foo&lt;/b>"/></li><li><b>foo</b></li><li>&lt;b>foo&lt;/b></li></ul>'
		);
		node.set.field.setAttribute('value', 'lax');
		assert.strictEqual(
			node.toString(),
			'<ul><li><input id="field" value="lax"/></li><li><b>foo</b></li><li>&lt;b>foo&lt;/b></li></ul>'
		);
		node.set.liveId = 'bar';
		assert.strictEqual(node.toString(), '<ul><li><input id="field" value="bar"/></li><li>bar</li><li>bar</li></ul>');
	});

	it('handles typescript loops', () => {
		const nodeString = getTSString('<ul><?v@items?><li><?=v?></li><?/@?></ul>');

		assert.ok(nodeString.indexOf("forEachItemsvI0 (self:JSNode, docElm:Document, node:Node, items:any)") > -1);
	});

	it('handles es files', () => {
		const node = htmlEncoder('hello world', 'es');
		assert.ok(node.indexOf('export function getNode') > -1);
	});
});
