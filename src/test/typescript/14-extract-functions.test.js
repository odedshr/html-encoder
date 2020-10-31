const assert = require('assert');
const { extractFunctions } = require('../../../dist/typescript/extract-functions');

describe('html-encoder-typescript: extract-functions', () => {
  it('handle empty if', () =>
    assert.strictEqual(extractFunctions({ type: 'ProcessingInstruction', tag: 'if' }, false, false),
      'undefined (self, docElm, node) {\n' +
      '          const fn = function () {  };\n' +
      '\t        return getAddedChildren(node, fn);\n' +
      '        }'
    )
  );

  it('handle if condition', () =>
    assert.strictEqual(extractFunctions({ type: 'ProcessingInstruction', tag: 'if', attributes: { functionName: 'foo' } }, false, false),
      'foo (self, docElm, node) {\n' +
      '          const fn = function () {  };\n' +
      '\t        return getAddedChildren(node, fn);\n' +
      '        }'
    )
  );

  it('handle if condition ts ssr', () =>
    assert.strictEqual(extractFunctions({ type: 'ProcessingInstruction', tag: 'if', attributes: { functionName: 'foo' } }, true, true),
      'foo (self:JSNode, docElm:Document, node:Node) {\n' +
      '          const fn = function () {  };\n' +
      '\t        return getAddedChildren(node, fn);\n' +
      '        }'
    )
  );

  it('handle empty foreach', () =>
    assert.strictEqual(extractFunctions({ type: 'ProcessingInstruction', tag: 'foreach' }, false, false),
      'undefined (self, docElm, node, items) {\n' +
      '          const fn = function() {\n' +
      '            \n' +
      '            \n' +
      '          };\n' +
      '\n' +
      "          return self._forEach('undefined', 'undefined', node, fn, items);\n" +
      '        }'
    )
  );
});