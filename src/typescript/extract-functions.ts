import { Instruction } from '../instruction';
import { appendNode } from './transpile.nodes';

export function extractFunctions(instruction: Instruction, isTypescript: boolean, isSSR: boolean): string {
  const queue: Instruction[] = [instruction];
  const output: String[] = [];

  while (queue.length) {
    //@ts-ignore
    const current: Instruction = queue.pop();

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

function getIfFunction(instruction: Instruction, isTypescript: boolean, isSSR: boolean) {
  const functionName = instruction.attributes?.functionName;
  const ifArgs = isTypescript ? 'node:Node' : 'node';
  return `${functionName} (${ifArgs}) {
          const fn = function () { ${instruction.children?.map(child => appendNode(child, isSSR)).join('\n') || ''} };
	        return getAddedChildren(node, fn);
        }`;
}

function getServerSideComment(functionName: string, iterator: string, index: string) {
  const indexString = `\${getValue(data, '${index}')}`;
  const iteratorString = `\${getValue(data, '${iterator}')}`;
  return `node.appendChild(document.createComment(\`PI:forEachItem ${functionName} ${indexString} ${iteratorString}\`));`;
}

function getForeachFunction(instruction: Instruction, isTypescript: boolean, isSSR: boolean = false) {
  const { iterator, index, functionName } = instruction.attributes as { [key: string]: string } || {};

  const loopArgs = isTypescript ? 'node:Node, items:any' : 'node, items';

  return `${functionName} (${loopArgs}) {
          const fn = function() {
            ${isSSR ? getServerSideComment(functionName, iterator, index) : ''}
            ${instruction.children?.map(child => appendNode(child, isSSR)).join('\n') || ''}
          };

          return iterate(data, '${iterator}', '${index}', node, fn, items);
        }`;
}