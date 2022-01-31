const assert = require('assert');
const { default: encode } = require('../../../dist/html-encoder');
// const { writeFileSync } = require('fs');


function testJSON(originalString, expectedJSON, /*testFileName = undefined*/) {
  try {
    const encodedNode = encode(originalString, 'json', true);
    // if (testFileName) {
    //   writeFileSync(`${testFileName}.log.json`, encodedNode);
    // }

    assert.strictEqual(encodedNode, JSON.stringify(expectedJSON));
  } catch (err) {
    assert.strictEqual(err.toString(), expectedJSON);
  }
}

module.exports = { testJSON };
