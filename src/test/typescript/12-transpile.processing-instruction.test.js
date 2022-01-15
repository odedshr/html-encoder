const assert = require('assert');
const { getProcessingInstruction } = require('../../../dist/typescript/transpile.processing-instruction');

describe('html-encoder-typescript: transpile.process-instruction', () => {
  it('handles unknown instruction', () => assert.strictEqual(getProcessingInstruction({
    tag: 'unknown'
  }, true),
    '\n' +
    '    \n' +
    '    node.appendChild((docElm => {\n' +
    "    const node = docElm.appendChild(docElm.createProcessingInstruction('unknown',''));\n" +
    '    return node;\n' +
    '  })(self.docElm));;\n' +
    '    \n' +
    '  '
  ));

  it('handles empty attribute instruction', () => assert.strictEqual(getProcessingInstruction({
    tag: 'attr'
  }, true),
    '\n    \n    ;\n    \n  '
  ));

  it('handles foreach instruction', () => assert.strictEqual(getProcessingInstruction({
    tag: 'foreach'
  }, true),
    '\n' +
    '    \n' +
    '    { \n' +
    '          const fn = self.funcs.undefined.bind({},self, self.docElm, node);\n' +
    '\t\t\t\t\tconst startAt = node.childNodes.length;\n' +
    "          const items = clone(self._getValue(self.data, 'undefined')) || [];\n" +
    '\t\t\t\t\tconst nodes = fn(items);\n' +
    '\t\t\t\t\t\n' +
    '\t\t\t\t};\n' +
    '    \n' +
    '  '
  ));

  it('handles if instruction', () => assert.strictEqual(getProcessingInstruction({
    tag: 'if'
  }, true),
    '\n    \n    ;\n    \n  '
  ));

  it('handles css instruction', () => assert.strictEqual(getProcessingInstruction({
    tag: 'css'
  }, true),
    '\n    node.appendChild(self.docElm.createComment(`PI:css `));\n    ;\n    \n  '
  ));
});