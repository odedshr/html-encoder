import { Instruction } from '../instruction';
import { getProcessingInstruction } from './transpile.processing-instruction';
import { getComment, getDocument, getDocumentFragment, getTextNode, getHTMLElement } from './transpile.nodes';

export function toTypescript(instruction: Instruction, isSSR: boolean = false): string {
  switch (instruction.type) {
    case 'document': return getDocument(instruction, isSSR);
    case 'documentFragment': return getDocumentFragment(instruction, isSSR);
    case 'text': return getTextNode(instruction);
    case 'element': return getHTMLElement(instruction, isSSR);
    case 'comment': return getComment(instruction);
    case 'ProcessingInstruction': return getProcessingInstruction(instruction, isSSR);
  }
}