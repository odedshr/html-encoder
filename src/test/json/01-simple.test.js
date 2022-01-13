const assert = require('assert');
const DOMParser = require('@xmldom/xmldom').DOMParser;
const domParser = new DOMParser();
const { testJSON } = require('./utils.js');

describe('html-encoder-json: basic operations', () => {
	it('converts static html', () => testJSON('<div>Hello <b>World</b></div>', {
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
			}
		]
	}));

	// It make the return Object is a single node, but the encoder handles gracefully when the input doesn't have a
	// wrapping element. In such case it returns DocumentFragment, which disappears when being append.
	it('converts unwrapped multiple html tags', () =>
		testJSON('<li>1</li><li>2</li><li>3</li>', {
			"type": "documentFragment",
			"children": [
				{
					"type": "element",
					"tag": "li",
					"children": [
						{
							"type": "text",
							"value": "1"
						}
					]
				},
				{
					"type": "element",
					"tag": "li",
					"children": [
						{
							"type": "text",
							"value": "2"
						}
					]
				},
				{
					"type": "element",
					"tag": "li",
					"children": [
						{
							"type": "text",
							"value": "3"
						}
					]
				}
			]
		}));

	// A full HTML document include the <!DOCTYPE> tag which requires a slightly different handling as it's not a standard
	// HTML tag, rather than instruction about the document
	it('converts a full static html', () =>
		testJSON(
			'<!DOCTYPE html><html><body>Hello <b>World</b></body></html>',
			{ "type": "document", "attributes": { "name": "html", "publicId": "", "systemId": "" }, "children": [{ "type": "element", "tag": "html", "children": [{ "type": "element", "tag": "body", "children": [{ "type": "text", "value": "Hello " }, { "type": "element", "tag": "b", "children": [{ "type": "text", "value": "World" }] }] }] }] }
		));

	// The encoder uses ProcessInstructions (PI) to properly parse dynamic files. However if it sees an unknown PI,
	// it simply ignores it.
	it('ignores unknown process instructions', () =>
		testJSON('<?ignore foo bar?>', {
			"type": "ProcessingInstruction",
			"tag": "ignore",
			"value": "foo bar"
		}));

	it('handles comments', () =>
		testJSON('<!-- this is a comment -->', {
			"type": "comment",
			"value": " this is a comment "
		}));

	it('handles empty file', () => testJSON('', {
		"type": "documentFragment"
	}));

	it('handles invalid xml', () => testJSON('<heading>Reminder</lala>', {
		"type": "documentFragment",
		"children": [
			{
				"type": "element",
				"tag": "heading"
			},
			{
				"type": "text",
				"value": "Reminder"
			}
		]
	}));


	// The encoder handles simple text inputs and inject their value from the provided data at run-time.
	it('supports <?=text?>', () => testJSON('<?=name?>', { "type": "ProcessingInstruction", "tag": "text", "value": "name" }));

	// it is possible to add HTML-friendly input
	it('supports <?==html?>', () =>
		testJSON('<?==name?>', {
			"type": "ProcessingInstruction",
			"tag": "html",
			"value": "name"
		}));
});
