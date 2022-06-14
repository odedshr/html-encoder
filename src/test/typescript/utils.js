const assert = require('assert');
const { writeFileSync } = require('fs');
const htmlEncoder = require('../../../dist/html-encoder').default;


// test() created a JS-based SSR-compatible node and compares it to the expected string
function test(originalString, data = {}, expectedString, description, testFileName = undefined) {
  const encodedNode = htmlEncoder(originalString, 'code');
  try {
    if (testFileName !== undefined) {
      writeFileSync(`${testFileName}.log.js`, encodedNode.toString());
    }

    assert.strictEqual(encodedNode.getNode(data).toString(), expectedString, description);
  } catch (err) {
    console.error(err, originalString);
    assert.fail();
  }
}

function getNodeFactory(htmlString, testFileName = undefined) {
  const encoded = htmlEncoder(htmlString, 'code');

  testFileName && writeFileSync(`${testFileName}.log.js`, htmlEncoder(htmlString, 'js').toString());

  return encoded.getNode;
}

// getNode() returns a JS-based browser-compatible node (we forcefully inject DOMParser in so it could still run server-side)
function getNode(htmlString, data, testFileName = undefined) {
  return getNodeFactory(htmlString, testFileName)(data);
}

function getSsrHtml(htmlString, data, testFileName = undefined) {
  const ssrEncoded = htmlEncoder(htmlString, 'code', true);

  testFileName && writeFileSync(`${testFileName}.server.js`, ssrEncoded.toString());

  const node = ssrEncoded.getNode(data);

  testFileName && writeFileSync(`${testFileName}.html`, node.toString());

  return node;
}

// getSSRNode() creates a JS-based SSR-compatible node but then use it as a base for browser-compatible node to return
function getSSRNode(htmlString, data, testFileName = undefined) {
  const ssrEncodedNode = getSsrHtml(htmlString, data, testFileName);
  const browserEncoded = htmlEncoder(htmlString, 'code', false); //TODO: change this test to es-code

  testFileName && writeFileSync(`${testFileName}.browser.js`, browserEncoded.toString());

  return browserEncoded.initNode(ssrEncodedNode);
}

function getTSString(htmlString, testFileName = undefined) {
  const tsEncoded = htmlEncoder(htmlString, 'ts');

  if (testFileName) {
    writeFileSync(`${testFileName}.log.ts`, tsEncoded);
  }

  return tsEncoded;
}

module.exports = { test, getSSRNode, getNodeFactory, getNode, getTSString };
