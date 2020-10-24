const assert = require('assert');
const { getSSRNode } = require('./utils.js');
const tags = / data-live-.*?=".*?"/g;

describe('html-encoder-typescript: server-side-rendering sub-routines', () => {
	it('supports <?value@array #liveId?></?@?>', () => {
		const node = getSSRNode('<ul><li>first</li><?v@items #value?><li><?=v?></li><?/@?><li>last</li></ul>', {
			items: ['a', 'b', 'c'],
		});
		assert.strictEqual(
			node.toString(),
			'<ul><li>first</li><li>a</li><li>b</li><li>c</li><li>last</li></ul>'
		);
		assert.strictEqual(JSON.stringify(node.set.value), '["a","b","c"]');
		node.set.value = [];
		assert.strictEqual(node.toString(), `<ul><li>first</li><li>last</li></ul>`);
		node.set.value = ['c', 'd', 'b'];
		assert.strictEqual(
			node.toString(),
			'<ul><li>first</li><li>c</li><li>d</li><li>b</li><li>last</li></ul>'
		);
		assert.strictEqual(JSON.stringify(node.set.value), '["c","d","b"]');
	});

	it('supports multiple ssr loops', () => {
		const node = getSSRNode('<ul><?v@letters #letters?><li><?=v?></li><?/@?><?v@numbers#?><li><?=v?></li><?/@?></ul>', {
			letters: ['a', 'b', 'c'],
			numbers: ['1', '2', '3'],
		});
		assert.strictEqual(
			node.toString(),
			'<ul><li>a</li><li>b</li><li>c</li><li>1</li><li>2</li><li>3</li></ul>'
		);
		node.set.letters = ['b', 'd'];
		node.set.numbers = ['4', '1', '5', '6'];
		assert.strictEqual(
			node.toString(),
			'<ul><li>b</li><li>d</li><li>4</li><li>1</li><li>5</li><li>6</li></ul>'
		);
	});

	it('supports iterations with multiple children', () => {
		const items = [
			{ k: 'foo', v: 'a' },
			{ k: 'bar', v: 'b' },
		];
		const node = getSSRNode('<dl><?i@items #value?><dt><?=i.k?></dt><dd><?=i.v?></dd><?/@?></dl>', { items });

		assert.strictEqual(node.toString(), '<dl><dt>foo</dt><dd>a</dd><dt>bar</dt><dd>b</dd></dl>');
		items.pop();
		assert.strictEqual(node.toString(), '<dl><dt>foo</dt><dd>a</dd><dt>bar</dt><dd>b</dd></dl>');
		items.unshift({ k: 'lax', v: 'c' });
		node.set.value = items;
		assert.strictEqual(node.toString(), '<dl><dt>lax</dt><dd>c</dd><dt>foo</dt><dd>a</dd></dl>');
	});

	it('supports <??boolean #liveId?>[content]<?/??>', () => {
		const node = getSSRNode('<ul><li>Foo</li><??foo #flag?><li>aa</li><li>bb</li><?/??><li>Bar</li></ul>', {
			foo: true,
		});
		assert.strictEqual(node.toString(), '<ul><li>Foo</li><li>aa</li><li>bb</li><li>Bar</li></ul>');
		assert.strictEqual(node.set.flag, true, 'value is set to true');
		node.set.flag = false;
		assert.strictEqual(node.toString(), '<ul><li>Foo</li><li>Bar</li></ul>');
		node.set.flag = true;
		assert.strictEqual(node.toString(), '<ul><li>Foo</li><li>aa</li><li>bb</li><li>Bar</li></ul>');
	});

	it('supports <??boolean#?>[content]<?/??>', () => {
		const node = getSSRNode('<ul><li>Foo</li><??foo#?><li>aa</li><li>bb</li><?/??><li>Bar</li></ul>', {
			foo: true,
		});
		assert.strictEqual(node.toString().replace(tags, ''), '<ul><li>Foo</li><li>aa</li><li>bb</li><li>Bar</li></ul>');
		assert.strictEqual(node.set.foo, true, 'value is set to true');
		node.set.foo = false;
		assert.strictEqual(node.toString().replace(tags, ''), '<ul><li>Foo</li><li>Bar</li></ul>');
		node.set.foo = true;
		assert.strictEqual(node.toString().replace(tags, ''), '<ul><li>Foo</li><li>aa</li><li>bb</li><li>Bar</li></ul>');
	});
});
