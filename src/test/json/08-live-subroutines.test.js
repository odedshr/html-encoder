const assert = require('assert');
const { testJSON } = require('./utils');

describe('html-encoder-json: real-time-sub-routines', () => {
	it('supports <?value@array #liveId?></?@?>',
		() => testJSON('<ul><li>first</li><?v@items #value?><li><?=v?></li><?/?><li>last</li></ul>', {
			"type": "element",
			"tag": "ul",
			"children": [
				{
					"type": "element",
					"tag": "li",
					"children": [
						{
							"type": "text",
							"value": "first"
						}
					]
				},
				{
					"type": "ProcessingInstruction",
					"tag": "foreach",
					"attributes": {
						"variable": "items",
						"iterator": "v",
						"index": "$i",
						"functionName": "forEachItemsvIvalue0"
					},
					"id": "value",
					"children": [
						{
							"type": "element",
							"tag": "li",
							"children": [
								{
									"type": "ProcessingInstruction",
									"tag": "text",
									"value": "v"
								}
							]
						}
					]
				},
				{
					"type": "element",
					"tag": "li",
					"children": [
						{
							"type": "text",
							"value": "last"
						}
					]
				}
			]
		})
	);

	it('supports live loop with varName as liveId',
		() => testJSON('<ul><li>first</li><?v@items#?><li><?=v?></li><?/?><li>last</li></ul>', {
			"type": "element",
			"tag": "ul",
			"children": [
				{
					"type": "element",
					"tag": "li",
					"children": [
						{
							"type": "text",
							"value": "first"
						}
					]
				},
				{
					"type": "ProcessingInstruction",
					"tag": "foreach",
					"attributes": {
						"variable": "items",
						"iterator": "v",
						"index": "$i",
						"functionName": "forEachItemsvIitems0"
					},
					"id": "items",
					"children": [
						{
							"type": "element",
							"tag": "li",
							"children": [
								{
									"type": "ProcessingInstruction",
									"tag": "text",
									"value": "v"
								}
							]
						}
					]
				},
				{
					"type": "element",
					"tag": "li",
					"children": [
						{
							"type": "text",
							"value": "last"
						}
					]
				}
			]
		})
	);

	it('supports <??boolean #liveId?>[content]<?/?>',
		() => testJSON('<ul><li>Foo</li><??foo #flag?><li>aa</li><li>bb</li><?/?><li>Bar</li></ul>', {
			"type": "element",
			"tag": "ul",
			"children": [
				{
					"type": "element",
					"tag": "li",
					"children": [
						{
							"type": "text",
							"value": "Foo"
						}
					]
				},
				{
					"type": "ProcessingInstruction",
					"tag": "if",
					"value": "foo",
					"attributes": {
						"functionName": "ifFooflag0"
					},
					"id": "flag",
					"children": [
						{
							"type": "element",
							"tag": "li",
							"children": [
								{
									"type": "text",
									"value": "aa"
								}
							]
						},
						{
							"type": "element",
							"tag": "li",
							"children": [
								{
									"type": "text",
									"value": "bb"
								}
							]
						}
					]
				},
				{
					"type": "element",
					"tag": "li",
					"children": [
						{
							"type": "text",
							"value": "Bar"
						}
					]
				}
			]
		})
	);

	it('supports <??boolean#?>[content]<?/?>',
		() => testJSON('<ul><li>Foo</li><??foo#?><li>aa</li><li>bb</li><?/?><li>Bar</li></ul>', {
			"type": "element",
			"tag": "ul",
			"children": [
				{
					"type": "element",
					"tag": "li",
					"children": [
						{
							"type": "text",
							"value": "Foo"
						}
					]
				},
				{
					"type": "ProcessingInstruction",
					"tag": "if",
					"value": "foo",
					"attributes": {
						"functionName": "ifFoofoo0"
					},
					"id": "foo",
					"children": [
						{
							"type": "element",
							"tag": "li",
							"children": [
								{
									"type": "text",
									"value": "aa"
								}
							]
						},
						{
							"type": "element",
							"tag": "li",
							"children": [
								{
									"type": "text",
									"value": "bb"
								}
							]
						}
					]
				},
				{
					"type": "element",
					"tag": "li",
					"children": [
						{
							"type": "text",
							"value": "Bar"
						}
					]
				}
			]
		}));
});
