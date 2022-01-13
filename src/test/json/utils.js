const assert = require('assert');
const htmlEncoder = require('../../../dist/html-encoder').default;
// const { writeFileSync } = require('fs');


function testJSON(originalString, expectedJSON, /*testFileName = undefined*/) {
  try {
    const encodedNode = htmlEncoder(originalString, 'json', true);
    // if (testFileName) {
    //   writeFileSync(`${testFileName}.log.json`, encodedNode);
    // }

    console.log('>>>', encodedNode);
    assert.strictEqual(encodedNode, JSON.stringify(expectedJSON));
  } catch (err) {
    assert.strictEqual(err.toString(), expectedJSON);
  }
}

module.exports = { testJSON };
