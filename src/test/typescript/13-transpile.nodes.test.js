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
    '(docElm => {\n' +
    '    const node = docElm;\n' +
    "    docElm.insertBefore(docElm.implementation.createDocumentType('foo', 'bar', 'lulu'), docElm.childNodes[0]);\n" +
    '    docElm.removeChild(docElm.childNodes[1]);\n' +
    '    \n' +
    '    return docElm;\n' +
    '  })(self.docElm)'
  ));

  it('handles text node instruction', () => assert.strictEqual(appendNode({
    type: 'text'
  }),
    'node.appendChild(self.docElm.createTextNode(`undefined`));'
  ));

  it('handles documentFragment node instruction', () => assert.strictEqual(appendNode({
    type: 'documentFragment'
  }),
    'node.appendChild((docElm => {\n' +
    '    const node = docElm.createDocumentFragment();\n' +
    '    return node;\n' +
    '  })(self.docElm));'
  ));

  it('handles text node instruction', () => assert.strictEqual(appendNode({
    type: 'comment'
  }),
    'node.appendChild(self.docElm.createComment(`undefined`));'
  ));
});
