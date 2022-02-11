const { testJSON } = require('./utils.js');

describe('html-encoder-json: conditionals', () => {
	it('supports <??booleans?>[content]<?/?>', () =>
		testJSON('<div><??flag1?>True<?/?><??!flag2?>False<?/?></div>', {
			"type": "element",
			"tag": "div",
			"children": [
				{
					"type": "ProcessingInstruction",
					"tag": "if",
					"value": "flag1",
					"attributes": {
						"functionName": "ifFlag1false0"
					},
					"children": [
						{
							"type": "text",
							"value": "True"
						}
					]
				},
				{
					"type": "ProcessingInstruction",
					"tag": "if",
					"value": "!flag2",
					"attributes": {
						"functionName": "ifFlag2false1"
					},
					"children": [
						{
							"type": "text",
							"value": "False"
						}
					]
				}
			]
		}));
});
