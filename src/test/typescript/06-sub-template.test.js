const { test, getNodeFactory } = require('./utils.js');

describe('html-encoder-typescript: sub-templates', () => {
  it('supports <?:subTemplate?>', () =>
    test(
      '<ul><?v@items?><?:liTemplate?><?/?></ul>',
      {
        items: ['a', 'b', 'c'],
        liTemplate: getNodeFactory('<li><?=v?></li>'),
      },
      '<ul><li>a</li><li>b</li><li>c</li></ul>'
    ));

  it(`supports <?:"imported-file.xml"?>`, () =>
    test(
      '<div class="image"><?:"./images/svg_logo.svg"?></div>',
      {},
      `<div class="image"><svg width="100" height="100">
   <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow"></circle>
   Sorry, your browser does not support inline SVG.
</svg></div>`
    ));

  it(`supports <?:"imported-file.txt"?>`, () =>
    test(
      `<pre><?:"./src/test/json/sample.json"?></pre>`,
      {},
      '<pre>{\n  \"foo\": \"bar\"\n}</pre>'
    ));
});
