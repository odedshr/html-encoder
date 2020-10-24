const assert = require('assert');
const requireFromString = require('require-from-string');
const { writeFileSync } = require('fs');
const htmlEncoder = require('../../../out/html-encoder').default;

function getOutputString(encodedNode, data) {
  const getNode = requireFromString(encodedNode).getNode;
  const jsNode = getNode(data);

  return jsNode.toString();
}

// test() created a JS-based SSR-compatible node and compares it to the expected string
function test(originalString, data = {}, expectedString, description, testFileName = undefined) {
  const encodedNode = addTestFixture(htmlEncoder(originalString, 'js', false));
  try {
    if (testFileName) {
      writeFileSync(`${testFileName}.log.js`, encodedNode);
    }

    assert.strictEqual(getOutputString(encodedNode, data), expectedString, description);
  } catch (err) {
    console.error(err, originalString);
    assert.fail();
  }
}

// test() created a JS-based SSR-compatible node and compares it to the expected string
function test(originalString, data = {}, expectedString, description, testFileName = undefined) {
  const encodedNode = addTestFixture(htmlEncoder(originalString, 'js', false));
  try {
    if (testFileName) {
      writeFileSync(`${testFileName}.log.js`, encodedNode);
    }

    assert.strictEqual(getOutputString(encodedNode, data), expectedString, description);
  } catch (err) {
    console.error(err, originalString);
    assert.fail();
  }
}

function addTestFixture(encodedNode) {
  return `
  const xmldom_1 = require("xmldom");
  const window = { DOMParser: xmldom_1.DOMParser };
  ${encodedNode}
  `;
}

function getNodeFactory(htmlString, testFileName = undefined) {
  const encoded = addTestFixture(htmlEncoder(htmlString));

  if (testFileName) {
    writeFileSync(`${testFileName}.log.js`, encoded);
  }

  return requireFromString(encoded).getNode;
}

// getNode() returns a JS-based browser-compatible node (we forcefully inject DOMParser in so it could still run server-side)
function getNode(htmlString, data, testFileName = undefined) {
  return getNodeFactory(htmlString, testFileName)(data);
}

function getSsrHtml(htmlString, data, testFileName = undefined) {
  const ssrEncoded = htmlEncoder(htmlString, 'js', true);

  testFileName && writeFileSync(`${testFileName}.server.js`, ssrEncoded);

  const getNode = requireFromString(ssrEncoded).getNode;
  const node = getNode(data);

  testFileName && writeFileSync(`${testFileName}.html`, node.toString());

  return node;
}

// getSSRNode() creates a JS-based SSR-compatible node but then use it as a base for browser-compatible node to return
function getSSRNode(htmlString, data, testFileName = undefined) {
  const ssrEncodedNode = getSsrHtml(htmlString, data, testFileName);
  const browserEncoded = `
  const xmldom_1 = require("xmldom");
  const window = { DOMParser: xmldom_1.DOMParser };
  ${htmlEncoder(htmlString, 'js', false)}
  `;

  testFileName && writeFileSync(`${testFileName}.browser.js`, browserEncoded);

  const initNode = requireFromString(browserEncoded).initNode;
  return initNode(ssrEncodedNode);
}

function getTSString(htmlString, testFileName = undefined) {
  const tsEncoded = htmlEncoder(htmlString, 'ts');

  if (testFileName) {
    writeFileSync(`${testFileName}.log.ts`, tsEncoded);
  }

  return tsEncoded;
}

module.exports = { test, getSSRNode, getNodeFactory, getNode, getTSString };
