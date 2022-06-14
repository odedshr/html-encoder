const assert = require('assert');
const { appendNode, getDocument } = require('../../../dist/typescript/transpile.nodes');

describe('html-encoder-typescript: transpile.process-instruction', () => {
  it('handles unknown type node instruction', () => assert.strictEqual(appendNode({
    type: 'unknown'
  }),
    ''
  ));

  it('handles document node instruction', () => assert.strictEqual(getDocument({
    attributes: { name: 'foo', publicId: 'bar', systemId: 'lulu' }
  }),
    '(() => {\n' +
    "    document.insertBefore(document.implementation.createDocumentType('foo', 'bar', 'lulu'), document.childNodes[0]);\n" +
    '    document.removeChild(document.childNodes[1]);\n' +
    '    const node = document;\n' +
    '    \n' +
    '    return document;\n' +
    '  })()'
  ));

  it('handles text node instruction', () => assert.strictEqual(appendNode({
    type: 'text'
  }),
    'node.appendChild(document.createTextNode(`undefined`));'
  ));

  it('handles documentFragment node instruction', () => assert.strictEqual(appendNode({
    type: 'documentFragment'
  }),
    `node.appendChild((() => {
    const node = document.createDocumentFragment();
    return node;
  })());`
  ));

  it('handles text node instruction', () => assert.strictEqual(appendNode({
    type: 'comment'
  }),
    'node.appendChild(document.createComment(`undefined`));'
  ));
});
