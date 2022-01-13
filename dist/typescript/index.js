"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transpile = void 0;
const fs_1 = require("fs");
const transpile_processing_instruction_1 = require("./transpile.processing-instruction");
const transpile_nodes_1 = require("./transpile.nodes");
const extract_functions_1 = require("./extract-functions");
const encoding = 'utf-8';
function transpile(instructions, type, isSSR = false) {
    const functions = (0, extract_functions_1.extractFunctions)(instructions, type === 'ts', isSSR);
    let parsedString = toTypescript(instructions, isSSR);
    const reactive = treeHasKey(instructions, 'id');
    if (reactive) {
        parsedString += `;self._defineSet();`;
    }
    return treeShake((0, fs_1.readFileSync)(getTemplateFile(type), { encoding })
        .replace(/console\.log\(self, node\)[;,]/, `this.node = ${parsedString};`)
        .replace(getReactivePattern(reactive, isSSR), '')
        .replace(/funcs: { \[key: string\]: Function } = {};/, `funcs: { \[key: string\]: Function } = {${functions}};/*here?*/`)
        .replace(/funcs = {};/, `funcs = {${functions}};`)
        .replace('//# sourceMappingURL=js-node.js.map', ''));
}
exports.transpile = transpile;
function getTemplateFile(type) {
    switch (type) {
        case 'ts':
            return `${__dirname}/js-node.template-ts`;
        case 'es':
            return `${__dirname}/js-node.es.js`;
        default:
            return `${__dirname}/js-node.js`;
    }
}
function toTypescript(instruction, isSSR = false) {
    switch (instruction.type) {
        case 'document': return (0, transpile_nodes_1.getDocument)(instruction, isSSR);
        case 'documentFragment': return (0, transpile_nodes_1.getDocumentFragment)(instruction, isSSR);
        case 'text': return (0, transpile_nodes_1.getTextNode)(instruction);
        case 'element': return (0, transpile_nodes_1.getHTMLElement)(instruction, isSSR);
        case 'comment': return (0, transpile_nodes_1.getComment)(instruction);
        case 'ProcessingInstruction': return (0, transpile_processing_instruction_1.getProcessingInstruction)(instruction, isSSR);
    }
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
//# sourceMappingURL=index.js.map