const { testJSON } = require('./utils.js');

describe('html-encoder-json: css class', () => {
	it('supports <?css class?> for sibling', () =>
		testJSON(
			'<div><?css state?>Hello</div>',
			{
				"type": "element",
				"tag": "div",
				"children": [
					{
						"type": "ProcessingInstruction",
						"tag": "css",
						"value": ["state"]
					},
					{
						"type": "text",
						"value": "Hello"
					}
				]
			}
		));

	it('supports <?css class?> for sibling', () =>
		testJSON(
			'<div><b>World</b><?css state?></div>',
			{
				"type": "element",
				"tag": "div",
				"children": [
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
						"tag": "css",
						"value": ["state"]
					}
				]
			}
		));

	it('supports <?css condition?class?> for sibling', () =>
		testJSON(
			'<div>Hello <b>World</b><?css c1?idx c2?lvl ?></div>',
			{
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
						"tag": "css",
						"value": [
							{
								"variable": "idx",
								"condition": "c1"
							},
							{
								"variable": "lvl",
								"condition": "c2"
							}
						]
					}
				]
			}
		));

	it('supports <?css class?> from a looped item', () =>
		testJSON(
			'<ul><?item@items?><li><?css item.color?>foo</li><?/?></ul>',
			{
				"type": "element",
				"tag": "ul",
				"children": [
					{
						"type": "ProcessingInstruction",
						"tag": "foreach",
						"attributes": {
							"variable": "items",
							"iterator": "item",
							"index": "$i",
							"functionName": "forEachItemsitemI0"
						},
						"children": [
							{
								"type": "element",
								"tag": "li",
								"children": [
									{
										"type": "ProcessingInstruction",
										"tag": "css",
										"value": ["item.color"]
									},
									{
										"type": "text",
										"value": "foo"
									}
								]
							}
						]
					}
				]
			}
		));
});
