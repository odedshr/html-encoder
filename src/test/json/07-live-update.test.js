const assert = require('assert');
const DOMParser = require('xmldom').DOMParser;
const { testJSON } = require('./utils');

const domParser = new DOMParser();

describe('html-encoder-json: real-time-updates', () => {
  it('supports <?=text #liveId?>', () => testJSON('<div>Hello <?=name #userName?></div>', {
    "type": "element",
    "tag": "div",
    "children": [
      {
        "type": "text",
        "value": "Hello "
      },
      {
        "type": "ProcessingInstruction",
        "tag": "text",
        "value": "name",
        "id": "userName"
      }
    ]
  }));

  it('supports <?=text#?>', () => testJSON('<div>Hello <?=name#?></div>', {
    "type": "element",
    "tag": "div",
    "children": [
      {
        "type": "text",
        "value": "Hello "
      },
      {
        "type": "ProcessingInstruction",
        "tag": "text",
        "value": "name",
        "id": "name"
      }
    ]
  }));

  it('supports <?==html #liveId?>', () => testJSON('<div>Hello <?==name #userName?></div>', {
    "type": "element",
    "tag": "div",
    "children": [
      {
        "type": "text",
        "value": "Hello "
      },
      {
        "type": "ProcessingInstruction",
        "tag": "html",
        "value": "name",
        "id": "userName"
      }
    ]
  }));

  it('supports <?==html#?>', () => testJSON('<div>Hello <?==name#?></div>', {
    "type": "element",
    "tag": "div",
    "children": [
      {
        "type": "text",
        "value": "Hello "
      },
      {
        "type": "ProcessingInstruction",
        "tag": "html",
        "value": "name",
        "id": "name"
      }
    ]
  }));

  it('replaces element using id', () => testJSON('<div><b id="liveId">foo</b></div>', {
    "type": "element",
    "tag": "div",
    "children": [
      {
        "type": "element",
        "tag": "b",
        "attributes": {
          "id": "liveId"
        },
        "id": "liveId",
        "children": [
          {
            "type": "text",
            "value": "foo"
          }
        ]
      }
    ]
  }));

  it('support <?css liveId#?>', () => testJSON('<div>Hello<?css item#?></div>', {
    "type": "element",
    "tag": "div",
    "children": [
      {
        "type": "text",
        "value": "Hello"
      },
      {
        "type": "ProcessingInstruction",
        "tag": "css",
        "value": [
          {
            "variable": "item",
            "id": "item"
          }
        ]
      }
    ]
  }));

  it('support <?css condition?liveId# isActive?>', () => testJSON('<div>Hello<?css flag?item# isActive?></div>', {
    "type": "element", "tag": "div",
    "children": [
      { "type": "text", "value": "Hello" },
      {
        "type": "ProcessingInstruction", "tag": "css", "value": [
          { "variable": "item", "condition": "flag", "id": "item" },
          "isActive"
        ]
      }
    ]
  }));

  it('supports <?attr attributeMap#?>', () => testJSON('<div><?attr attributeMap#?>Hello</div>', {
    "type": "element",
    "tag": "div",
    "children": [
      {
        "type": "ProcessingInstruction",
        "tag": "attr",
        "attributes": {
          "attributeMap": {
            "id": "attributeMap"
          }
        }
      },
      {
        "type": "text",
        "value": "Hello"
      }
    ]
  }));

  it('supports <?attr value#live=key?>', () => testJSON('<div><?attr value#live=value?>Hello</div>', {
    "type": "element",
    "tag": "div",
    "children": [
      {
        "type": "ProcessingInstruction",
        "tag": "attr",
        "attributes": {
          "value": {
            "variable": "value",
            "id": "live"
          }
        }
      },
      {
        "type": "text",
        "value": "Hello"
      }
    ]
  }));

  it('supports <?attr value#=key?>', () => testJSON('<div><?attr value#=value?>Hello</div>', {
    "type": "element",
    "tag": "div",
    "children": [
      {
        "type": "ProcessingInstruction",
        "tag": "attr",
        "attributes": {
          "value": {
            "variable": "value",
            "id": "value"
          }
        }
      },
      {
        "type": "text",
        "value": "Hello"
      }
    ]
  }));

  it('supports <?attr value#{variable}=key ?>', () => testJSON('<div><?attr value#{varName}=value?>Hello</div>', {
    "type": "element",
    "tag": "div",
    "children": [
      {
        "type": "ProcessingInstruction",
        "tag": "attr",
        "attributes": {
          "value": {
            "variable": "value",
            "id": "{varName}"
          }
        }
      },
      {
        "type": "text",
        "value": "Hello"
      }
    ]
  }));
});
