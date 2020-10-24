const { testJSON } = require('./utils.js');

describe('html-encoder-json: sub-templates', () => {
  it('supports <?:subTemplate?>', () =>
    testJSON(
      '<ul><?v@items?><?:liTemplate?><?/@?></ul>',
      {
        "type": "element",
        "tag": "ul",
        "children": [
          {
            "type": "ProcessingInstruction",
            "tag": "foreach",
            "attributes": {
              "variable": "items",
              "iterator": "v",
              "index": "$i",
              "functionName": "forEachItemsvI0"
            },
            "children": [
              {
                "type": "ProcessingInstruction",
                "tag": "template",
                "value": "liTemplate"
              }
            ]
          }
        ]
      }
    ));

  it(`supports <?:"import-file.xml"?>`, () =>
    testJSON(`<?:"./images/svg_logo.svg"?>`, {
      "type": "ProcessingInstruction",
      "tag": "template",
      "children": [
        {
          "type": "element",
          "tag": "svg",
          "attributes": {
            "width": "100",
            "height": "100"
          },
          "children": [
            {
              "type": "text",
              "value": "\n   "
            },
            {
              "type": "element",
              "tag": "circle",
              "attributes": {
                "cx": "50",
                "cy": "50",
                "r": "40",
                "stroke": "green",
                "stroke-width": "4",
                "fill": "yellow"
              }
            },
            {
              "type": "text",
              "value": "\n   Sorry, your browser does not support inline SVG.\n"
            }
          ]
        }
      ]
    }));

  it(`supports <?:"import-file.txt"?>`, () =>
    testJSON(`<?:"./src/test/json/sample.json"?>`, {
      "type": "ProcessingInstruction",
      "tag": "template",
      "children": [
        {
          "type": "text",
          "value": "{\n  \"foo\": \"bar\"\n}"
        }
      ]
    }));
});
