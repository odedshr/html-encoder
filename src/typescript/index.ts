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
    readFileSync(getTemplateFile(__dirname, type), { encoding })
      .replace(/console\.log\(self, node\)[;,]/, `this.node = ${parsedString};`)
      .replace(getReactivePattern(reactive, isSSR), '')
      .replace(/funcs: { \[key: string\]: Function } = {};/, `funcs: { \[key: string\]: Function } = {${functions}};`)
      .replace(/funcs = {};/, `funcs = {${functions}};`)
      .replace(/\n(this\.)?funcs(: { \[key: string\]: Function })? = {};/, '')
      .replace('//# sourceMappingURL=js-node.js.map', '')
  );
}

function getTemplateFile(folderName: String, type: TargetType): string {
  switch (type) {
    case 'ts':
      return `${folderName}/js-node.template-ts`;
    case 'es':
      return `${folderName}/js-node.es.js`;
    default:
      return `${folderName}/js-node.js`;
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
  let feature = 'browser|server|any';

  if (reactive) {
    feature = isSSR ? 'browser' : 'server';
  }

  return new RegExp(`\\s*\/\/ feature (${feature})-reactivity\\r?\\n[\\s\\S]*?\/\/ feature \\1-reactivity end`, 'gm');
}

function treeShake(code: string) {
  findFeatures(code).forEach((feature) => {
    const query: string = isFeatureUsed(code, feature)
      ? `\\s*\/\/ shakeable ${feature}( end)?` // remove feature's comments
      : `\\s*\/\/ shakeable ${feature}\\r?\\n[\\s\\S]*?\/\/ shakeable ${feature} end`; // remove feature

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
