"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTypescript = void 0;
const transpile_processing_instruction_1 = require("./transpile.processing-instruction");
const transpile_nodes_1 = require("./transpile.nodes");
function toTypescript(instruction, isSSR = false) {
    switch (instruction.type) {
        case 'document': return transpile_nodes_1.getDocument(instruction, isSSR);
        case 'documentFragment': return transpile_nodes_1.getDocumentFragment(instruction, isSSR);
        case 'text': return transpile_nodes_1.getTextNode(instruction);
        case 'element': return transpile_nodes_1.getHTMLElement(instruction, isSSR);
        case 'comment': return transpile_nodes_1.getComment(instruction);
        case 'ProcessingInstruction': return transpile_processing_instruction_1.getProcessingInstruction(instruction, isSSR);
    }
}
exports.toTypescript = toTypescript;
//# sourceMappingURL=transpile.js.map