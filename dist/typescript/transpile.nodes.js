"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComment = exports.getDocumentFragment = exports.getDocument = exports.appendNode = exports.getNode = void 0;
const transpile_attributes_1 = require("./transpile.attributes");
const transpile_processing_instruction_1 = require("./transpile.processing-instruction");
function getNode(instruction, isSSR = false) {
    switch (instruction.type) {
        case 'document': return getDocument(instruction, isSSR);
        case 'documentFragment': return getDocumentFragment(instruction, isSSR);
        case 'text': return getTextNode(instruction);
        case 'element': return getHTMLElement(instruction, isSSR);
        case 'comment': return getComment(instruction);
        case 'ProcessingInstruction': return (0, transpile_processing_instruction_1.getProcessingInstruction)(instruction, isSSR);
    }
}
exports.getNode = getNode;
function appendNode(instruction, isSSR = false) {
    const node = getNode(instruction, isSSR);
    switch (instruction.type) {
        case 'documentFragment':
        case 'text':
        case 'element':
        case 'comment': return `node.appendChild(${node});`;
        case 'ProcessingInstruction': return (0, transpile_processing_instruction_1.getProcessingInstruction)(instruction, isSSR);
    }
    return '';
}
exports.appendNode = appendNode;
function getDocument(instruction, isSSR) {
    var _a, _b, _c;
    const name = (_a = instruction.attributes) === null || _a === void 0 ? void 0 : _a.name;
    const publicId = ((_b = instruction.attributes) === null || _b === void 0 ? void 0 : _b.publicId) || '';
    const systemId = ((_c = instruction.attributes) === null || _c === void 0 ? void 0 : _c.systemId) || '';
    return `(docElm => {
    const node = docElm;
    docElm.insertBefore(docElm.implementation.createDocumentType('${name}', '${publicId}', '${systemId}'), docElm.childNodes[0]);
    docElm.removeChild(docElm.childNodes[1]);
    ${appendChildren(instruction.children, isSSR)}
    return docElm;
  })(self.docElm)`;
}
exports.getDocument = getDocument;
function getDocumentFragment(instruction, isSSR) {
    return `(docElm => {
    const node = docElm.createDocumentFragment();
    ${instruction ? appendChildren(instruction.children, isSSR) : ''}return node;
  })(self.docElm)`;
}
exports.getDocumentFragment = getDocumentFragment;
function getComment(instruction) {
    return `self.docElm.createComment(\`${instruction.value}\`)`;
}
exports.getComment = getComment;
function getTextNode(instruction) {
    return `self.docElm.createTextNode(\`${instruction.value}\`)`;
}
function getHTMLElement(instruction, isSSR) {
    const attributes = (instruction.attributes) ? (0, transpile_attributes_1.getAttributes)(instruction.attributes) : '';
    return `(docElm =>{
    const node = docElm.createElement('${instruction.tag}');
    ${attributes}${appendChildren(instruction.children, isSSR)}
    return node;
  })(self.docElm)`;
}
function appendChildren(children = [], isSSR) {
    return children.map(child => appendNode(child, isSSR)).join('\n');
}
//# sourceMappingURL=transpile.nodes.js.map