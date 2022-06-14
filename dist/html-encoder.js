"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeParser = void 0;
const fs_1 = require("fs");
const html_to_json_1 = require("./html-to-json");
exports.NodeParser = html_to_json_1.default;
const index_1 = require("./typescript/index");
/**
* Generates a string of instructions how to recreate the provided XML
* @param string xmlString - can be simple text string, but it if it's XML (HTML or SVG, for example) it'll be parsed accordingly
* @param TargetType targetType - supported output type. Current available statuses are json, js (javascript), es ("js" file but in ES6 format) and ts (typescript)
* @param boolean isServerSide - a flag indicating whether code should include additional comments that will help the file become dynamic once sent to the browser
* @return string - instructions to recreate the HTML.
*/
function htmlEncoder(html, type = 'js', isSSR = false) {
    const parser = new html_to_json_1.default(html, type === 'ts');
    if (type === 'json') {
        return parser.toString();
    }
    const stringifiedCode = fixLibraryImport((0, index_1.transpile)(parser.getJSON(), type, isSSR), type === 'es' || type === 'es-code');
    if (type !== 'code' && type !== 'es-code') {
        return stringifiedCode;
    }
    return toCode(stringifiedCode);
}
exports.default = htmlEncoder;
function fixLibraryImport(code, isModule = false) {
    if (isModule) {
        return code.replace('./js-node.lib.js', `https://unpkg.com/html-encoder@${getVersion()}/dist/typescript/js-node.lib.js`);
    }
    return code.replace('./js-node.lib.js', './typescript/js-node.lib.js');
}
function getVersion() {
    return JSON.parse((0, fs_1.readFileSync)(`${__dirname}/../package.json`, 'utf-8')).version || 'latest';
}
function toCode(stringifiedCode) {
    try {
        return new Function('require', `const exports ={}; ${stringifiedCode}; return exports;`)(require);
    }
    catch (err) {
        console.log('Error codifying string', err);
    }
    return null;
}
//# sourceMappingURL=html-encoder.js.map