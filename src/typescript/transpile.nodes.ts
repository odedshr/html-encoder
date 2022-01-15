import { Instruction } from '../instruction';
import { getAttributes } from './transpile.attributes';
import { getProcessingInstruction } from './transpile.processing-instruction';

export function appendNode(instruction: Instruction, isSSR: boolean): string {
  switch (instruction.type) {
    case 'documentFragment': return `node.appendChild(${getDocumentFragment(instruction, isSSR)});`;
    case 'text': return `node.appendChild(${getTextNode(instruction)});`;
    case 'element': return `node.appendChild(${getHTMLElement(instruction, isSSR)});`;
    case 'comment': return `node.appendChild(${getComment(instruction)});`;
    case 'ProcessingInstruction': return getProcessingInstruction(instruction, isSSR);
  }

  return '';
}

export function getDocument(instruction: Instruction, isSSR: boolean) {
  const name: string = instruction.attributes?.name as string;
  const publicId: string = instruction.attributes?.publicId as string || '';
  const systemId: string = instruction.attributes?.systemId as string || '';
  return `(docElm => {
    const node = docElm;
    docElm.insertBefore(docElm.implementation.createDocumentType('${name}', '${publicId}', '${systemId}'), docElm.childNodes[0]);
    docElm.removeChild(docElm.childNodes[1]);
    ${appendChildren(instruction.children, isSSR)}
    return docElm;
  })(self.docElm)`;
}

export function getDocumentFragment(instruction: Instruction, isSSR: boolean) {
  return `(docElm => {
    const node = docElm.createDocumentFragment();
    ${instruction ? appendChildren(instruction.children, isSSR) : ''}return node;
  })(self.docElm)`;
}

export function getComment(instruction: Instruction) {
  return `self.docElm.createComment(\`${instruction.value}\`)`;
}

export function getTextNode(instruction: Instruction) {
  return `self.docElm.createTextNode(\`${instruction.value}\`)`;
}

export function getHTMLElement(instruction: Instruction, isSSR: boolean) {
  const attributes = (instruction.attributes) ? getAttributes(instruction.attributes) : '';

  return `(docElm =>{
    const node = docElm.createElement('${instruction.tag}');
    ${attributes}${appendChildren(instruction.children, isSSR)}
    return node;
  })(self.docElm)`;
}

function appendChildren(children: Instruction[] = [], isSSR: boolean): string {
  return children.map(child => appendNode(child, isSSR)).join('\n');
}