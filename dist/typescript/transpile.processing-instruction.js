"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProcessingInstruction = void 0;
const transpile_attributes_1 = require("./transpile.attributes");
const transpile_nodes_1 = require("./transpile.nodes");
function getServerSideProcessingInstruction(instruction) {
    return `
    ${getProcessingInstructionComment(instruction)}
    ${getProcessingInstruction(instruction, false)};
    ${getProcessingInstructionCommentEnd(instruction)}
  `;
}
function isAttributeWithId(value) {
    return value && (typeof value === 'object') && value.hasOwnProperty('id');
}
function getProcessingInstructionComment(instruction) {
    switch (instruction.tag) {
        case 'text':
        case 'html':
            return getSSRTextOrHTMLProcessingInstruction(instruction);
        case 'css':
            return getSSRCssProcessingInstruction(instruction);
        case 'attr':
            return getSSRAttributeProcessingInstruction(instruction);
        case 'foreach':
            return getSSRForEachProcessingInstruction(instruction, false);
        case 'if':
            return getSSRIfProcessingInstruction(instruction, false);
        default:
            return '';
    }
}
function getSSRTextOrHTMLProcessingInstruction(instruction) {
    if (!instruction.id) {
        return '';
    }
    const content = [instruction.tag, instruction.id].join(' ');
    return `node.appendChild(${(0, transpile_nodes_1.getComment)({ type: 'ProcessingInstruction', tag: 'comment', value: `PI:${content}` })});`;
}
function getSSRCssProcessingInstruction(instruction) {
    const value = (Array.isArray(instruction.value) ? instruction.value : [instruction.value])
        .filter(isAttributeWithId)
        //@ts-ignore (filter should have kicked out all irrelevant types)
        .map(item => `${(item === null || item === void 0 ? void 0 : item.id) || ''}:${item === null || item === void 0 ? void 0 : item.variable}`);
    return `node.appendChild(${(0, transpile_nodes_1.getComment)({
        type: 'ProcessingInstruction',
        tag: 'comment',
        value: `PI:css ${value.join(' ')}`
    })});`;
}
function getSSRAttributeProcessingInstruction(instruction) {
    if (!instruction.attributes) {
        return '';
    }
    const attr = [
        instruction.tag,
        instruction.id,
        ...Object.keys(instruction.attributes)
            .map(key => instruction.attributes && instruction.attributes[key])
            .filter(attribute => !!attribute)
            .map(attribute => {
            const id = ((attribute === null || attribute === void 0 ? void 0 : attribute.id) || '');
            const pattern = id.match(/^{(.*)}$/); // checking if id is not variable to be read
            return {
                id: `${id}${pattern ? `=\${self._getValue(self.data, \'${pattern[1]}\')}` : ''}`,
                variable: attribute === null || attribute === void 0 ? void 0 : attribute.variable
            };
        })
            .map(attribute => ((attribute === null || attribute === void 0 ? void 0 : attribute.variable)
            ? `${attribute.id}:${attribute.variable}` // normal attribute
            : `${attribute.id}` // attributeMap
        ))
    ].filter(s => (s && s.length)).join(' ');
    return `node.appendChild(${(0, transpile_nodes_1.getComment)({ type: 'ProcessingInstruction', tag: 'comment', value: `PI:${attr}` })});`;
}
function getSSRForEachProcessingInstruction(instruction, isEnd) {
    if (!instruction.id) {
        return '';
    }
    const prefix = isEnd ? '/PI' : 'PI';
    const { variable, functionName } = instruction.attributes || {};
    const loopDetails = [instruction.id, variable, functionName].join(' ');
    return `node.appendChild(${(0, transpile_nodes_1.getComment)({ type: 'ProcessingInstruction', tag: 'comment', value: `${prefix}:foreach ${loopDetails}` })});`;
}
function getSSRIfProcessingInstruction(instruction, isEnd) {
    if (!instruction.id) {
        return '';
    }
    const prefix = isEnd ? '/PI' : 'PI';
    const { functionName } = instruction.attributes || {};
    const ifDetails = [instruction.id, functionName].join(' ');
    return `node.appendChild(${(0, transpile_nodes_1.getComment)({ type: 'ProcessingInstruction', tag: 'comment', value: `${prefix}:if ${ifDetails}` })});`;
}
function getProcessingInstructionCommentEnd(instruction) {
    if (!instruction.id) {
        return '';
    }
    else if (instruction.tag === 'foreach') {
        return getSSRForEachProcessingInstruction(instruction, true);
    }
    const content = [instruction.tag, instruction.id].join(' ');
    return `node.appendChild(${(0, transpile_nodes_1.getComment)({ type: 'ProcessingInstruction', tag: 'comment', value: `/PI:${content}` })});`;
}
function getProcessingInstruction(instruction, isSSR) {
    if (isSSR) {
        return getServerSideProcessingInstruction(instruction);
    }
    switch (instruction.tag) {
        case 'text':
            return getTextProcessingInstruction(instruction);
        case 'html':
            return getHTMLProcessingInstruction(instruction);
        case 'attr':
            return getAttributeProcessingInstruction(instruction);
        case 'css':
            return getCSSProcessingInstruction(instruction);
        case 'if':
            return getIfProcessingInstruction(instruction);
        case 'foreach':
            return getForEachProcessingInstruction(instruction);
        case 'template':
            return getTemplateProcessingInstruction(instruction, isSSR);
    }
    return getUnknownProcessingInstruction(instruction);
}
exports.getProcessingInstruction = getProcessingInstruction;
function getTextProcessingInstruction(instruction) {
    if (instruction.id) {
        return `node.appendChild((()=>{
        const node = docElm.createTextNode(self._getValue(self.data, '${instruction.value}'));
        self.register('${instruction.id}',{ node, type: 'text' });
        return node;
      })());`;
    }
    return `node.appendChild(docElm.createTextNode(self._getValue(self.data, '${instruction.value}')));`;
}
function getHTMLProcessingInstruction(instruction) {
    const register = (instruction.id) ? `self.register('${instruction.id}', { node, type: 'html' });\n` : '';
    const attributes = (instruction.attributes) ? (0, transpile_attributes_1.getAttributes)(instruction.attributes) : '';
    return `node.appendChild((()=>{
          const node = this._getHTMLNode(self._getValue(self.data, '${instruction.value}'));
          ${attributes}${register}return node;
        })());`;
}
function getAttributeProcessingInstruction(instruction) {
    const attributes = instruction.attributes;
    if (!attributes) {
        return '';
    }
    return `(elm => {
    let node = getPrecedingOrSelf(elm);
    ${(0, transpile_attributes_1.getAttributes)(attributes)}
  })(node);`;
}
function getCSSProcessingInstruction(instruction) {
    const instructions = [
        `{ let tmpElm = getPrecedingOrSelf(node), tmpCss = tmpElm.getAttribute('class') || '',
		target = tmpCss.length ? tmpCss.split(/\s/) : [];`,
    ];
    if (!instruction.value) {
        return '';
    }
    (Array.isArray(instruction.value) ? instruction.value : [instruction.value]).forEach((value) => {
        const { condition = false, variable, id = false } = (typeof (value) === 'string') ? { variable: value } : value;
        if (condition) {
            instructions.push(`if (self._getValue(self.data, '${condition}')) {`);
        }
        instructions.push(`tmpCss = self._getValue(self.data, '${variable}');
				(Array.isArray(tmpCss) ? tmpCss : [tmpCss]).forEach(function (css) { target.push(css); });
			`);
        if (condition) {
            instructions.push('}');
        }
    });
    instructions.push(`tmpElm.setAttribute('class', target.join(' ')); }`);
    return instructions.join('\n');
}
function getIfProcessingInstruction(instruction) {
    var _a;
    const variable = instruction.value;
    const functionName = (_a = instruction.attributes) === null || _a === void 0 ? void 0 : _a.functionName;
    if (!variable || !functionName) {
        return '';
    }
    const id = instruction.id;
    const liveIfString = id
        ? `self.register('${id}', { type: 'if', node, details: { startAt, fn, fnName: '${functionName}', nodes, flag } });\n`
        : '';
    return ` {
          const startAt = node.childNodes.length;
					const fn = self.funcs.${functionName}.bind({},self, docElm, node);
					const flag = !!self._getValue(self.data, '${variable}');
					const nodes = flag ? fn() : [];

					${liveIfString}
				}`;
}
function getForEachProcessingInstruction(instruction) {
    const { variable, functionName } = instruction.attributes || {};
    const id = instruction.id;
    const liveLoopString = id
        ? `self.register('${id}', { type: 'foreach', node , details: { startAt, fn, fnName: '${functionName}', items, nodes } });\n`
        : '';
    return `{ 
          const fn = self.funcs.${functionName}.bind({},self, docElm, node);
					const startAt = node.childNodes.length;
          const items = clone(self._getValue(self.data, '${variable}')) || [];
					const nodes = fn(items);
					${liveLoopString}
				}`;
}
function getTemplateProcessingInstruction(instruction, isSSR) {
    if (instruction.children) {
        return instruction.children.map(instruction => (0, transpile_nodes_1.appendNode)(instruction, isSSR)).join('\n');
    }
    return `node.appendChild(self._getSubTemplate('${instruction.value}'));`;
}
function getUnknownProcessingInstruction(instruction) {
    return `node.appendChild((()=>{
    const node = docElm.appendChild(docElm.createProcessingInstruction('${instruction.tag}','${instruction.value || ''}'));
    return node;
  })());`;
}
//# sourceMappingURL=transpile.processing-instruction.js.map