const assert = require('assert');
const DOMParser = require('@xmldom/xmldom').DOMParser;
const { getNode } = require('./utils');

const domParser = new DOMParser();

describe('html-encoder-typescript: real-time-updates', () => {
  it('throws an error trying to access non-existing property', () => {
    const node = getNode('<div>Hello <?=name #userName?></div>', {
      name: 'World',
    });
    assert.throws(() => { node.set.notExists = 'Dave'; }, new Error(`property 'notExists' not found`));
    assert.strictEqual(node.set.notExists, undefined);
  });

  it('supports updating element with id', () => {
    const node = getNode('<div id="elm" data-test="foo">Hello</div>', {});
    assert.strictEqual(node.toString(), '<div id="elm" data-test="foo">Hello</div>');
    assert.strictEqual(node.set.elm.getAttribute('data-test'), 'foo');
    node.set.elm.setAttribute('data-test', 'bar')
    assert.strictEqual(node.toString(), '<div id="elm" data-test="bar">Hello</div>');
  });

  it('supports <?=text #liveId?>', () => {
    const node = getNode('<div>Hello <?=name #userName?></div>', {
      name: 'World',
    });
    assert.strictEqual(node.toString(), '<div>Hello World</div>');
    assert.strictEqual(node.set.userName, 'World');
    node.set.userName = 'Dave';
    assert.strictEqual(node.toString(), '<div>Hello Dave</div>');
  });

  it('supports <?=text#?>', () => {
    const node = getNode('<div>Hello <?=name#?></div>', { name: 'World' });
    assert.strictEqual(node.toString(), '<div>Hello World</div>');
    node.set.name = 'Dave';
    assert.strictEqual(node.toString(), '<div>Hello Dave</div>');
  });

  it('supports <?==html #liveId?> updating with string', () => {
    const node = getNode('<div>Hello <?==name #name?></div>', { name: '<b>World</b>' });
    assert.strictEqual(node.toString(), '<div>Hello <b>World</b></div>');
    node.set.name = '<i>Dave</i>';
    assert.strictEqual(node.toString(), '<div>Hello <i>Dave</i></div>');
  });

  it('supports <?==html#?> updating with string', () => {
    const node = getNode('<div>Hello <?==name#?></div>', { name: '<b>World</b>' });
    assert.strictEqual(node.toString(), '<div>Hello <b>World</b></div>');
    node.set.name = '<i>Dave</i>';
    assert.strictEqual(node.toString(), '<div>Hello <i>Dave</i></div>');
  });

  it('supports <?==html #liveId?> updating with node', () => {
    const node = getNode('<div>Hello <?==name #name?></div>', { name: '<b>World</b>' });
    assert.strictEqual(node.toString(), '<div>Hello <b>World</b></div>');
    node.set.name = domParser.parseFromString('<u>Claire</u>');
    assert.strictEqual(node.toString(), '<div>Hello <u>Claire</u></div>');
  });

  it('replaces element using id', () => {
    const node = getNode('<div><b id="liveId">foo</b></div>', {});
    assert.strictEqual(node.toString(), '<div><b id="liveId">foo</b></div>');
    node.set.liveId = domParser.parseFromString('<i>bar</i>');
    assert.strictEqual(node.toString(), '<div><i>bar</i></div>');
    node.set.liveId = domParser.parseFromString('<u>success</u>');
    assert.strictEqual(node.toString(), '<div><u>success</u></div>');
  });

  it('supports <div id="liveId"><?attr value=key?></div> for parent', () => {
    const node = getNode('<div id="myElement"><?attr value=value?>Hello</div>', { value: 'foo' });
    assert.strictEqual(node.toString(), '<div id="myElement" value="foo">Hello</div>');
    node.set.myElement.setAttribute('value', 'bar');
    assert.strictEqual(node.toString(), '<div id="myElement" value="bar">Hello</div>');
  });

  it('supports <?attr attributeMap#?>', () => {
    const node = getNode('<div><?attr attributeMap#?>Hello</div>', {});
    assert.strictEqual(node.toString(), '<div>Hello</div>');
    node.set.attributeMap = { val1: 'bar', val2: 'foo' };
    assert.strictEqual(node.toString(), '<div val1="bar" val2="foo">Hello</div>');
  });

  it('supports <?attr value#live=key?>', () => {
    const node = getNode('<div><?attr value#live=value?>Hello</div>', { value: 'foo' });
    assert.strictEqual(node.toString(), '<div value="foo">Hello</div>');
    node.set.live = 'bar';
    assert.strictEqual(node.toString(), '<div value="bar">Hello</div>');
  });

  it('supports <?attr value#=key?>', () => {
    const node = getNode('<div><?attr value1#=value1 value2=value2?>Hello</div>', {
      value1: 'val1',
      value2: 'val2',
    });
    assert.strictEqual(node.toString(), '<div value1="val1" value2="val2">Hello</div>');
    node.set.value1 = 'val3';
    assert.strictEqual(node.toString(), '<div value1="val3" value2="val2">Hello</div>');
  });

  it('supports <?attr value#{variable}=key ?>', () => {
    const node = getNode('<div><?attr value#{varName}=value?>Hello</div>', { value: 'david', varName: 'foo' });
    assert.strictEqual(node.toString(), '<div value="david">Hello</div>');
    node.set.foo = 'claire';
    assert.strictEqual(node.toString(), '<div value="claire">Hello</div>');
  });

  it('updates node.set.value when element changes', () => {
    const node = getNode('<div><input type="text" id="field"/><?attr value#=value?></div>', { value: 'adam' });
    assert.strictEqual(node.toString(), '<div><input type="text" id="field" value="adam"/></div>');
    node.set.value = 'beth';
    assert.strictEqual(node.toString(), '<div><input type="text" id="field" value="beth"/></div>');
    node.set.field.setAttribute('value', 'claire');
    assert.strictEqual(node.set.value, 'claire');
  });

  it('supports live-update full document', () => {
    const node = getNode(
      `<!DOCTYPE html>
         <html class="no-js" lang="">
           <body>
             <div id="foo"></div>
           </body>
         </html>`,
      {}
    );
    assert.strictEqual(
      node.toString(),
      `<!DOCTYPE html>
         <html class="no-js" lang="">
           <body>
             <div id="foo"></div>
           </body>
         </html>`
    );
    node.set.foo.setAttribute('value', 'bar');
    assert.strictEqual(
      node.toString(),
      `<!DOCTYPE html>
         <html class="no-js" lang="">
           <body>
             <div id="foo" value="bar"></div>
           </body>
         </html>`
    );
  });
});
