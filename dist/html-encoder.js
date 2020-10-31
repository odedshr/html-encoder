"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const html_to_json_1 = require("./html-to-json");
const index_1 = require("./typescript/index");
const encoding = 'utf-8';
function htmlEncoder(html, type = 'js', isSSR = false) {
    return treeShake(transpile(new html_to_json_1.default(html, type === 'ts'), type, isSSR));
}
exports.default = htmlEncoder;
function getTemplateFile(type) {
    switch (type) {
        case 'ts':
            return `${__dirname}/typescript/js-node.template-ts`;
        case 'es':
            return `${__dirname}/typescript/js-node.es.js`;
        default:
            return `${__dirname}/typescript/js-node.js`;
    }
}
function transpile(parser, type, isSSR) {
    if (type === 'json') {
        return parser.toString();
    }
    const instructions = parser.getJSON();
    const functions = index_1.extractFunctions(instructions, type === 'ts', isSSR);
    let parsedString = index_1.toTypescript(instructions, isSSR);
    const reactive = treeHasKey(instructions, 'id');
    if (reactive) {
        parsedString += `;self._defineSet();`;
    }
    return fs_1.readFileSync(getTemplateFile(type), { encoding })
        .replace(/console\.log\(self, node\)[;,]/, `this.node = ${parsedString};`)
        .replace(getReactivePattern(reactive, isSSR), '')
        .replace(/funcs: { \[key: string\]: Function } = {};/, `funcs: { \[key: string\]: Function } = {${functions}};/*here?*/`)
        .replace(/funcs = {};/, `funcs = {${functions}};`);
}
function treeHasKey(node, key) {
    const items = Object.keys(node);
    while (items.length) {
        const current = items.shift() || '';
        if (current === key) {
            return true;
        }
        else if (current === 'attributes') {
            const childResult = Object.keys(node.attributes)
                .find((attr) => treeHasKey(node.attributes[attr], key));
            if (childResult) {
                return true;
            }
        }
        else if (Array.isArray(node[current])) {
            const childResult = node[current].find((child) => treeHasKey(child, key));
            if (childResult) {
                return true;
            }
        }
    }
    return false;
}
function getReactivePattern(reactive, isSSR) {
    let feature = '((browser|server)-)?reactivity';
    if (reactive) {
        feature = isSSR ? 'browser-reactivity' : 'server-reactivity';
    }
    return new RegExp(`\\s*\/\/ feature ${feature}\\n[\\s\\S]*?\/\/ feature ${feature} end`, 'gm');
}
function treeShake(code) {
    findFeatures(code).forEach((feature) => {
        const query = isFeatureUsed(code, feature)
            ? `\\s*\/\/ shakeable ${feature}( end)?` // remove feature's comments
            : `\\s*\/\/ shakeable ${feature}\\n[\\s\\S]*?\/\/ shakeable ${feature} end`; // remove feature
        code = code.replace(new RegExp(query, 'gm'), '');
    });
    return code;
}
function isFeatureUsed(code, feature) {
    return (code.match(new RegExp(`${feature} = function|${feature}\\(|${feature}.bind`, 'gm')) || []).length > 1;
}
function findFeatures(code) {
    const featureFinder = /\s*\/\/ shakeable (\w*) end\n/g;
    const features = [];
    let match;
    while ((match = featureFinder.exec(code)) !== null) {
        features.push(match[1]);
    }
    return features;
}
//# sourceMappingURL=html-encoder.js.map