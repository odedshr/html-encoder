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
    '(()=>{\n' +
    '    const node =  docElm;\n' +
    "    docElm.insertBefore(docElm.implementation.createDocumentType('foo', 'bar', 'lulu'), docElm.childNodes[0]);\n" +
    '    docElm.removeChild(docElm.childNodes[1]);\n' +
    '    \n' +
    '    return docElm;\n' +
    '  })()'
  ));

  it('handles text node instruction', () => assert.strictEqual(appendNode({
    type: 'text'
  }),
    'node.appendChild(docElm.createTextNode(`undefined`));'
  ));

  it('handles documentFragment node instruction', () => assert.strictEqual(appendNode({
    type: 'documentFragment'
  }),
    'node.appendChild((()=>{\n' +
    '    const node = docElm.createDocumentFragment();\n' +
    '    return node;\n' +
    '  })());'
  ));

  it('handles text node instruction', () => assert.strictEqual(appendNode({
    type: 'comment'
  }),
    'node.appendChild(docElm.createComment(`undefined`));'
  ));
});
