const { testJSON } = require('./utils.js');

describe('html-encoder-json: loops', () => {
  it('supports <?value@array?></?@?>', () =>
    testJSON(
      '<ul><?v@items?><li><?=v?></li><?/?></ul>',
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
          }
        ]
      }
    ));

  it('supports <?value:key@array?></?@?>', () =>
    testJSON(
      '<ul><?v:k@items?><li><?=v?><?=k?></li><?/?></ul>',
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
              "index": "k",
              "functionName": "forEachItemsvk0"
            },
            "children": [
              {
                "type": "element",
                "tag": "li",
                "children": [
                  {
                    "type": "ProcessingInstruction",
                    "tag": "text",
                    "value": "v"
                  },
                  {
                    "type": "ProcessingInstruction",
                    "tag": "text",
                    "value": "k"
                  }
                ]
              }
            ]
          }
        ]
      }
    ));


  it('supports loop end with no start', () =>
    testJSON(
      '<ul><!-- comment -->foo<span>bar</span><?/?></ul>',
      'Error: end of subRoutine without start: ["t{ comment }","t{foo}","span","/"]'
    )
  );
});
