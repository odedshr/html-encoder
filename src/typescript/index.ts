import { readFileSync } from 'fs';
import { Instruction } from '../instruction';
import { getProcessingInstruction } from './transpile.processing-instruction';
import { getComment, getDocument, getDocumentFragment, getTextNode, getHTMLElement } from './transpile.nodes';
import { extractFunctions } from './extract-functions';

const encoding = 'utf-8';

export type TargetType = 'js' | 'es' | 'ts';
export function transpile(instructions: Instruction, type: TargetType, isSSR: boolean = false): string {
  const functions = extractFunctions(instructions, type === 'ts', isSSR);
  let parsedString = toTypescript(instructions, isSSR);
  const reactive = treeHasKey(instructions, 'id');
  if (reactive) {
    parsedString += `;self._defineSet();`;
  }

  return treeShake(
    readFileSync(getTemplateFile(type), { encoding })
      .replace(/console\.log\(self, node\)[;,]/, `this.node = ${parsedString};`)
      .replace(getReactivePattern(reactive, isSSR), '')
      .replace(/funcs: { \[key: string\]: Function } = {};/, `funcs: { \[key: string\]: Function } = {${functions}};/*here?*/`)
      .replace(/funcs = {};/, `funcs = {${functions}};`)
      .replace('//# sourceMappingURL=js-node.js.map', '')
  );
}

function getTemplateFile(type: TargetType): string {
  switch (type) {
    case 'ts':
      return `${__dirname}/js-node.template-ts`;
    case 'es':
      return `${__dirname}/js-node.es.js`;
    default:
      return `${__dirname}/js-node.js`;
  }
}

function toTypescript(instruction: Instruction, isSSR: boolean = false): string {
  switch (instruction.type) {
    case 'document': return getDocument(instruction, isSSR);
    case 'documentFragment': return getDocumentFragment(instruction, isSSR);
    case 'text': return getTextNode(instruction);
    case 'element': return getHTMLElement(instruction, isSSR);
    case 'comment': return getComment(instruction);
    case 'ProcessingInstruction': return getProcessingInstruction(instruction, isSSR);
  }
}

function treeHasKey(node: { [key: string]: any }, key: string) {
  const items: string[] = Object.keys(node);

  while (items.length) {
    const current = items.shift() || '';
    if (current === key) {
      return true;
    } else if (current === 'attributes') {
      const childResult = Object.keys(node.attributes)
        .find((attr: any) => treeHasKey(node.attributes[attr], key));
      if (childResult) {
        return true;
      }
    } else if (Array.isArray(node[current])) {
      const childResult = node[current].find((child: any) => treeHasKey(child, key));
      if (childResult) {
        return true;
      }
    }
  }
  return false;
}

function getReactivePattern(reactive: boolean, isSSR: boolean) {
  let feature = '((browser|server)-)?reactivity';

  if (reactive) {
    feature = isSSR ? 'browser-reactivity' : 'server-reactivity';
  }

  return new RegExp(`\\s*\/\/ feature ${feature}\\n[\\s\\S]*?\/\/ feature ${feature} end`, 'gm');
}

function treeShake(code: string) {
  findFeatures(code).forEach((feature) => {
    const query: string = isFeatureUsed(code, feature)
      ? `\\s*\/\/ shakeable ${feature}( end)?` // remove feature's comments
      : `\\s*\/\/ shakeable ${feature}\\n[\\s\\S]*?\/\/ shakeable ${feature} end`; // remove feature

    code = code.replace(new RegExp(query, 'gm'), '');
  });

  return code;
}

function isFeatureUsed(code: string, feature: string): boolean {
  return (code.match(new RegExp(`${feature} = function|${feature}\\(|${feature}.bind`, 'gm')) || []).length > 1;
}

function findFeatures(code: string): string[] {
  const featureFinder: RegExp = /\s*\/\/ shakeable (\w*) end\n/g;
  const features: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = featureFinder.exec(code)) !== null) {
    features.push(match[1]);
  }

  return features;
}
