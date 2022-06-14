"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFunctions = void 0;
const transpile_nodes_1 = require("./transpile.nodes");
function extractFunctions(instruction, isTypescript, isSSR) {
    const queue = [instruction];
    const output = [];
    while (queue.length) {
        //@ts-ignore
        const current = queue.pop();
        if (current.type === 'ProcessingInstruction') {
            switch (current.tag) {
                case 'if':
                    output.push(getIfFunction(current, isTypescript, isSSR));
                    break;
                case 'foreach':
                    output.push(getForeachFunction(current, isTypescript, isSSR));
                    break;
            }
        }
        (current.children || []).forEach(child => queue.push(child));
    }
    return output.filter(s => s.length).join(',\n');
}
exports.extractFunctions = extractFunctions;
function getIfFunction(instruction, isTypescript, isSSR) {
    var _a, _b;
    const functionName = (_a = instruction.attributes) === null || _a === void 0 ? void 0 : _a.functionName;
    const ifArgs = isTypescript ? 'node:Node' : 'node';
    return `${functionName} (${ifArgs}) {
          const fn = function () { ${((_b = instruction.children) === null || _b === void 0 ? void 0 : _b.map(child => (0, transpile_nodes_1.appendNode)(child, isSSR)).join('\n')) || ''} };
	        return getAddedChildren(node, fn);
        }`;
}
function getServerSideComment(functionName, iterator, index) {
    const indexString = `\${getValue(data, '${index}')}`;
    const iteratorString = `\${getValue(data, '${iterator}')}`;
    return `node.appendChild(document.createComment(\`PI:forEachItem ${functionName} ${indexString} ${iteratorString}\`));`;
}
function getForeachFunction(instruction, isTypescript, isSSR = false) {
    var _a;
    const { iterator, index, functionName } = instruction.attributes || {};
    const loopArgs = isTypescript ? 'node:Node, items:any' : 'node, items';
    return `${functionName} (${loopArgs}) {
          const fn = function() {
            ${isSSR ? getServerSideComment(functionName, iterator, index) : ''}
            ${((_a = instruction.children) === null || _a === void 0 ? void 0 : _a.map(child => (0, transpile_nodes_1.appendNode)(child, isSSR)).join('\n')) || ''}
          };

          return iterate(data, '${iterator}', '${index}', node, fn, items);
        }`;
}
//# sourceMappingURL=extract-functions.js.map