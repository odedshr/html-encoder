"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFunctions = void 0;
const transpile_nodes_1 = require("./transpile.nodes");
function extractFunctions(instruction, isTypescript, isSSR) {
    if (instruction.type === 'ProcessingInstruction') {
        switch (instruction.tag) {
            case 'if':
                return getIfFunction(instruction, isTypescript, isSSR);
            case 'foreach':
                return getForeachFunction(instruction, isTypescript, isSSR);
        }
    }
    return (instruction.children || [])
        .map(child => extractFunctions(child, isTypescript, isSSR))
        .filter(s => s.length)
        .join(',\n');
}
exports.extractFunctions = extractFunctions;
function getIfFunction(instruction, isTypescript, isSSR) {
    var _a, _b;
    const functionName = (_a = instruction.attributes) === null || _a === void 0 ? void 0 : _a.functionName;
    const ifArgs = isTypescript ? 'self:JSNode, docElm:Document, node:Node' : 'self, docElm, node';
    return `${functionName} (${ifArgs}) {
          const fn = function () { ${((_b = instruction.children) === null || _b === void 0 ? void 0 : _b.map(child => transpile_nodes_1.appendNode(child, isSSR)).join('\n')) || ''} };
	        return getAddedChildren(node, fn);
        }`;
}
function getServerSideComment(functionName, iterator, index) {
    const indexString = `\${self._getValue(self.data, '${index}')}`;
    const iteratorString = `\${self._getValue(self.data, '${iterator}')}`;
    return `node.appendChild(docElm.createComment(\`PI:forEachItem ${functionName} ${indexString} ${iteratorString}\`));`;
}
function getForeachFunction(instruction, isTypescript, isSSR = false) {
    var _a;
    const { iterator, index, functionName } = instruction.attributes || {};
    const loopArgs = isTypescript ? 'self:JSNode, docElm:Document, node:Node, items:any' : 'self, docElm, node, items';
    return `${functionName} (${loopArgs}) {
          const fn = function() {
            ${isSSR ? getServerSideComment(functionName, iterator, index) : ''}
            ${((_a = instruction.children) === null || _a === void 0 ? void 0 : _a.map(child => transpile_nodes_1.appendNode(child, isSSR)).join('\n')) || ''}
          };

          return self._forEach('${iterator}', '${index}', node, fn, items);
        }`;
}
//# sourceMappingURL=extract-functions.js.map