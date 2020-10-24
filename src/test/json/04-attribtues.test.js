const { testJSON } = require('./utils.js');

describe('html-encoder-json: attributes', () => {
	it('support hard-coded attributes', () =>
		testJSON(
			'<div id="foo">bar</div>',
			{
				"type": "element",
				"tag": "div",
				"attributes": {
					"id": "foo"
				},
				"id": "foo",
				"children": [
					{
						"type": "text",
						"value": "bar"
					}
				]
			}
		)
	);

	it('supports <?attr key=value key2=value2?> for parent', () =>
		testJSON(
			'<div><?attr val1=a val2=b?>Hello <b>World</b></div>',
			{
				"type": "element",
				"tag": "div",
				"children": [
					{
						"type": "ProcessingInstruction",
						"tag": "attr",
						"attributes": {
							"val1": {
								"variable": "a"
							},
							"val2": {
								"variable": "b"
							}
						}
					},
					{
						"type": "text",
						"value": "Hello "
					},
					{
						"type": "element",
						"tag": "b",
						"children": [
							{
								"type": "text",
								"value": "World"
							}
						]
					}
				]
			}
		));

	it('supports <?attr attributeMap?> for parent', () =>
		testJSON(
			'<div><?attr attrs?>Hello <b>World</b></div>',
			{
				"type": "element",
				"tag": "div",
				"children": [
					{
						"type": "ProcessingInstruction",
						"tag": "attr",
						"attributes": {
							"attrs": {}
						}
					},
					{
						"type": "text",
						"value": "Hello "
					},
					{
						"type": "element",
						"tag": "b",
						"children": [
							{
								"type": "text",
								"value": "World"
							}
						]
					}
				]
			}
		));

	it('supports <?attr key=value?> for sibling', () =>
		testJSON('<div>Hello <b>World</b><?attr value=a?></div>', {
			"type": "element",
			"tag": "div",
			"children": [
				{
					"type": "text",
					"value": "Hello "
				},
				{
					"type": "element",
					"tag": "b",
					"children": [
						{
							"type": "text",
							"value": "World"
						}
					]
				},
				{
					"type": "ProcessingInstruction",
					"tag": "attr",
					"attributes": {
						"value": {
							"variable": "a"
						}
					}
				}
			]
		}));

	it('supports <?attr key=value?> for sibling after a text-node', () =>
		testJSON('<div>Hello World<?attr value=a?></div>', {
			"type": "element",
			"tag": "div",
			"children": [
				{
					"type": "text",
					"value": "Hello World"
				},
				{
					"type": "ProcessingInstruction",
					"tag": "attr",
					"attributes": {
						"value": {
							"variable": "a"
						}
					}
				}
			]
		}));

	it('supports <?attr condition?key=value?> for parent', () =>
		testJSON(
			'<div><?attr c1?val1=a c2?val2=b?>Hello <b>World</b></div>',
			{
				"type": "element",
				"tag": "div",
				"children": [
					{
						"type": "ProcessingInstruction",
						"tag": "attr",
						"attributes": {
							"val1": {
								"condition": "c1",
								"variable": "a"
							},
							"val2": {
								"condition": "c2",
								"variable": "b"
							}
						}
					},
					{
						"type": "text",
						"value": "Hello "
					},
					{
						"type": "element",
						"tag": "b",
						"children": [
							{
								"type": "text",
								"value": "World"
							}
						]
					}
				]
			}
		));

	it('supports <?attr condition?key="hardcoded"?> for parent', () =>
		testJSON(
			'<div><?attr c1?val1="a" c2?val2=\'b\' c3?val3=c?>Hello</div>',
			{
				"type": "element",
				"tag": "div",
				"children": [
					{
						"type": "ProcessingInstruction",
						"tag": "attr",
						"attributes": {
							"val1": {
								"condition": "c1",
								"variable": "'a'"
							},
							"val2": {
								"condition": "c2",
								"variable": "'b'"
							},
							"val3": {
								"condition": "c3",
								"variable": "c"
							}
						}
					},
					{
						"type": "text",
						"value": "Hello"
					}
				]
			}
		));

	it('supports <?attr !condition?key=value?> for parent', () =>
		testJSON(
			'<div><?attr !c1?val1=a !c2?val2=b?>Hello</div>',
			{
				"type": "element",
				"tag": "div",
				"children": [
					{
						"type": "ProcessingInstruction",
						"tag": "attr",
						"attributes": {
							"val1": {
								"condition": "!c1",
								"variable": "a"
							},
							"val2": {
								"condition": "!c2",
								"variable": "b"
							}
						}
					},
					{
						"type": "text",
						"value": "Hello"
					}
				]
			}
		));

	it('supports <?attr condition?attrs?> for parent', () =>
		testJSON(
			'<div><?attr c1?attrs ?>Foo</div>',
			{
				"type": "element",
				"tag": "div",
				"children": [
					{
						"type": "ProcessingInstruction",
						"tag": "attr",
						"attributes": {
							"attrs": {
								"condition": "c1"
							}
						}
					},
					{
						"type": "text",
						"value": "Foo"
					}
				]
			}
		));
});
