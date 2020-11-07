"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const html_to_json_1 = require("./html-to-json");
const index_1 = require("./typescript/index");
function htmlEncoder(html, type = 'js', isSSR = false) {
    return transpile(new html_to_json_1.default(html, type === 'ts'), type, isSSR);
}
exports.default = htmlEncoder;
function transpile(parser, type, isSSR) {
    if (type === 'json') {
        return parser.toString();
    }
    return index_1.transpile(parser.getJSON(), type, isSSR);
}
//# sourceMappingURL=html-encoder.js.map