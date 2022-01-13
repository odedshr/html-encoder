const assert = require('assert');
const { DOMParser } = require('@xmldom/xmldom');
const { getSSRNode } = require('./utils.js');
const domParser = new DOMParser();

describe('html-encoder-typescript: server-side-rendering tagging', () => {
	it('supports <?=text #liveId?>', () => {
		const node = getSSRNode('<div>Hello <?=name #name?></div>', { name: 'World' });
		assert.strictEqual(node.toString(), '<div>Hello World</div>');
		node.set.name = 'David';
		assert.strictEqual(node.toString(), '<div>Hello David</div>');
	});

	it('supports <?==html #liveId?> updating with a new node', () => {
		const node = getSSRNode('<div>Hello <?==name #name?></div>', {
			name: '<b>World</b>',
		});
		assert.strictEqual(node.toString(), '<div>Hello <b>World</b></div>');

		node.set.name = domParser.parseFromString('<i>David</i>');
		assert.strictEqual(node.toString(), '<div>Hello <i>David</i></div>');
	});

	it('supports <?==css #liveId?> updating with a new node', () => {
		const node = getSSRNode('<div>Hello<?css #name?></div>', {
			name: 'selected',
		});
		assert.strictEqual(node.toString(), '<div class="selected">Hello</div>');

		node.set.name = 'active';
		assert.strictEqual(node.toString(), '<div class="active">Hello</div>');
	});

	it('supports <?attr attributeMap#?>', () => {
		const node = getSSRNode('<div><?attr attributeMap#?>Hello</div>', {});
		assert.strictEqual(node.toString(), '<div>Hello</div>');
		node.set.attributeMap = { val1: 'bar', val2: 'foo' };
		assert.strictEqual(
			node.toString(),
			'<div val1="bar" val2="foo">Hello</div>'
		);
	});

	it('supports <?attr value#live=key?>', () => {
		const node = getSSRNode('<div><?attr value#live=value?>Hello</div>', { value: 'foo' });
		assert.strictEqual(node.toString(), '<div value="foo">Hello</div>');
		node.set.live = 'bar';
		assert.strictEqual(node.toString(), '<div value="bar">Hello</div>');
	});

	it('supports <?attr value#=key?>', () => {
		const node = getSSRNode('<div><?attr value1#=value1 value2#=value2?>Hello</div>', {
			value1: 'val1',
			value2: 'val2',
		});
		assert.strictEqual(
			node.toString(),
			'<div value1="val1" value2="val2">Hello</div>'
		);
		node.set.value1 = 'val3';
		assert.strictEqual(
			node.toString(),
			'<div value1="val3" value2="val2">Hello</div>'
		);
	});

	it('supports <?attr value#{variable}=key ?>', () => {
		const node = getSSRNode('<div><?attr value#{varName}=value?>Hello</div>', {
			value: 'david',
			varName: 'foo',
		});
		assert.strictEqual(node.toString(), '<div value="david">Hello</div>');
		node.set.foo = 'claire';
		assert.strictEqual(node.toString(), '<div value="claire">Hello</div>');
	});

	it('add tags for value; ignore id attribute', () => {
		const node = getSSRNode('<div><input type="text" id="field"/><?attr value#=value?></div>', {
			value: 'adam',
		});
		assert.strictEqual(
			node.toString(),
			'<div><input type="text" id="field" value="adam"/></div>'
		);
		node.set.value = 'beth';
		assert.strictEqual(
			node.toString(),
			'<div><input type="text" id="field" value="beth"/></div>'
		);
		node.set.field.setAttribute('value', 'claire');
		assert.strictEqual(node.set.value, 'claire', 'value read from set');
	});

	it('supports multiple roots', () => {
		const child = getSSRNode('<li class="child"><?==content #child?></li>', { content: 'foo' });
		assert.strictEqual(child.toString(), '<li class="child">foo</li>');
		const parent = getSSRNode('<ul class="parent"><?==content #parent?><li id="sibling"></li></ul>', {
			content: child,
		});
		assert.strictEqual(
			parent.toString(),
			'<ul class="parent"><li class="child">foo</li><li id="sibling"></li></ul>'
		);
		child.set.child = 'bar';
		assert.strictEqual(
			parent.toString(),
			'<ul class="parent"><li class="child">bar</li><li id="sibling"></li></ul>'
		);
		assert.strictEqual(Object.keys(parent.set).toString(), 'parent,sibling', `child variables weren't added to parents`);
	});

	it('supports live-update full document', () => {
		const node = getSSRNode(
			`<!DOCTYPE html>
			<html class="no-js" lang="">
				<body>
					<div id="foo"></div>
				</body>
			</html>`,
			{}
		);
		assert.strictEqual(
			node.toString(),
			`<!DOCTYPE html>
			<html class="no-js" lang="">
				<body>
					<div id="foo"></div>
				</body>
			</html>`
		);
		node.set.foo.setAttribute('value', 'bar');
		assert.strictEqual(
			node.toString(),
			`<!DOCTYPE html>
			<html class="no-js" lang="">
				<body>
					<div id="foo" value="bar"></div>
				</body>
			</html>`,
			'injected html updated'
		);
	});
});
