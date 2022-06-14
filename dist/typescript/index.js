"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transpile = void 0;
const fs_1 = require("fs");
const transpile_nodes_1 = require("./transpile.nodes");
const extract_functions_1 = require("./extract-functions");
const transpile_analyze_1 = require("./transpile.analyze");
const encoding = 'utf-8';
function transpile(instructions, type, isSSR = false) {
    const functions = (0, extract_functions_1.extractFunctions)(instructions, type === 'ts', isSSR);
    let parsedString = (0, transpile_nodes_1.getNode)(instructions, isSSR);
    const { revivable, attr, css, data } = (0, transpile_analyze_1.analyze)(instructions);
    if (revivable) {
        parsedString += `;attachSetToNode(set, node);`;
    }
    return treeShake((0, fs_1.readFileSync)(getTemplateFile(__dirname, type), { encoding })
        .replace('const node = document.createTextNode(\'main-code-goes-here\');', `const node = ${parsedString};`)
        .replace('/*!funcs go here*/', functions)
        .replace(select('data', data), '')
        .replace(select('funcs', functions.length > 0), '')
        .replace('//# sourceMappingURL=js-node.js.map', '')
        .replace(/(\r?\n){2,}/gm, '\n'));
}
exports.transpile = transpile;
function select(sectionName, justClosures) {
    return new RegExp(justClosures ? `\/\\*!?}?(${sectionName})\{?\\*\/` : `\/\\*!?(${sectionName})\{\\*\/((.|\n)*?)\/\\*!?\}\\1\\*\/`, 'gm');
}
function getTemplateFile(folderName, type) {
    const template = `${folderName}/js-node`;
    switch (type) {
        case 'ts':
            return `${template}.template-ts`;
        case 'es':
        case 'es-code':
            return `${template}.es.js`;
        default:
            return `${template}.js`;
    }
}
function treeShake(code) {
    var _a;
    const matches = /\/\*\!shakeable \{\*\/((.)*?)\/\*\!\} shakeable\*\//mg.exec(code);
    if (matches === null) {
        return code;
    }
    const allFeatures = (_a = matches[1]) !== null && _a !== void 0 ? _a : '';
    const usedFeatures = allFeatures
        .replace(/\s/g, '')
        .split(',')
        .filter(feature => { var _a; return ((_a = code.match(new RegExp(feature, 'g'))) !== null && _a !== void 0 ? _a : []).length > 1; })
        .join(', ');
    return code.replace(matches[0], usedFeatures);
}
//# sourceMappingURL=index.js.map