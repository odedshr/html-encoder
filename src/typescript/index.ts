import { readFileSync } from 'fs';
import { Instruction } from '../instruction';
import { getNode } from './transpile.nodes';
import { extractFunctions } from './extract-functions';
import { analyze } from './transpile.analyze';

const encoding = 'utf-8';

export type TargetType = 'js' | 'es' | 'ts' | 'code' | 'es-code';

export function transpile(instructions: Instruction, type: TargetType, isSSR: boolean = false): string {
  const functions = extractFunctions(instructions, type === 'ts', isSSR);
  let parsedString = getNode(instructions, isSSR);
  const { revivable, attr, css, data } = analyze(instructions);
  if (revivable) {
    parsedString += `;attachSetToNode(set, node);`;
  }

  return treeShake(
    readFileSync(getTemplateFile(__dirname, type), { encoding })
      .replace('const node = document.createTextNode(\'main-code-goes-here\');', `const node = ${parsedString};`)
      .replace('/*!funcs go here*/', functions)
      .replace(select('data', data), '')
      .replace(select('funcs', functions.length > 0), '')
      .replace('//# sourceMappingURL=js-node.js.map', '')
      .replace(/(\r?\n){2,}/gm, '\n')
  );
}

function select(sectionName: string, justClosures: boolean) {
  return new RegExp(justClosures ? `\/\\*!?}?(${sectionName})\{?\\*\/` : `\/\\*!?(${sectionName})\{\\*\/((.|\n)*?)\/\\*!?\}\\1\\*\/`, 'gm');
}

function getTemplateFile(folderName: String, type: TargetType): string {
  const template = `${folderName}/js-node`;
  switch (type) {
    case 'ts':
      return `${template}.template-ts`;
    case 'es':
    case 'es-code':
      return `${template}.es.js`;
    default:
      return `${template}.js`;
  }
}

function treeShake(code: string) {
  const matches = /\/\*\!shakeable \{\*\/((.)*?)\/\*\!\} shakeable\*\//mg.exec(code);
  if (matches === null) {
    return code;
  }

  const allFeatures = matches[1] ?? '';
  const usedFeatures = allFeatures
    .replace(/\s/g, '')
    .split(',')
    .filter(feature => (code.match(new RegExp(feature, 'g')) ?? []).length > 1)
    .join(', ');
  return code.replace(matches[0], usedFeatures);
}