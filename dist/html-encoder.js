"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const html_to_json_1 = require("./html-to-json");
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
    return index_1.transpile(parser.getJSON(), type, isSSR);
}
exports.default = htmlEncoder;
//# sourceMappingURL=html-encoder.js.map