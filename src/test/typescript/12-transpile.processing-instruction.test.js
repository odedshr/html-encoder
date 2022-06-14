const assert = require('assert');
const { getProcessingInstruction } = require('../../../dist/typescript/transpile.processing-instruction');

describe('html-encoder-typescript: transpile.process-instruction', () => {
  it('handles unknown instruction', () => assert.strictEqual(getProcessingInstruction({
    tag: 'unknown'
  }, true),
    '\n' +
    '    \n' +
    "    document.createProcessingInstruction('unknown','');;\n" +
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
    '          const fn = funcs.undefined.bind({}, node);\n' +
    '\t\t\t\t\tconst startAt = node.childNodes.length;\n' +
    "          const items = clone(getValue(data, 'undefined')) || [];\n" +
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
    '\n    node.appendChild(document.createComment(`PI:css `));\n    ;\n    \n  '
  ));
});