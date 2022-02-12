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
        parsedString += `;self._defineSet();`;
    }
    return treeShake((0, fs_1.readFileSync)(getTemplateFile(__dirname, type), { encoding })
        .replace(select('revive', revivable), '')
        .replace(select('NodeType', revivable || attr || css), '')
        .replace('/*! main-code-goes-here */', `((node) => { self.node = ${parsedString}; })(self.docElm);`)
        .replace(select('any\-dynamic', revivable), '')
        .replace(select('browser\-dynamic', revivable && !isSSR), '')
        .replace(select('server\-dynamic', revivable && isSSR), '')
        .replace(select('data', data), '')
        .replace('/*!funcs go here*/', functions)
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
            return `${template}.es.js`;
        default:
            return `${template}.js`;
    }
}
function treeShake(code) {
    return findFeatures(code)
        .reduce((code, feature) => code.replace(select(`shakeable ${feature}`, isFeatureUsed(code, feature)), ''), code);
}
function isFeatureUsed(code, feature) {
    return (code.match(new RegExp(`${feature} = function|${feature}\\(|${feature}.bind`, 'gm')) || []).length > 1;
}
function findFeatures(code) {
    const featureFinder = /\/\*!shakeable (\w*){\*\/\n/g;
    const features = [];
    let match;
    while ((match = featureFinder.exec(code)) !== null) {
        features.push(match[1]);
    }
    return features;
}
//# sourceMappingURL=index.js.map