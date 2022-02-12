import { readFileSync } from 'fs';
import { Instruction } from '../instruction';
import { getNode } from './transpile.nodes';
import { extractFunctions } from './extract-functions';
import { analyze } from './transpile.analyze';

const encoding = 'utf-8';

export type TargetType = 'js' | 'es' | 'ts' | 'code';
export function transpile(instructions: Instruction, type: TargetType, isSSR: boolean = false): string {
  const functions = extractFunctions(instructions, type === 'ts', isSSR);
  let parsedString = getNode(instructions, isSSR);
  const { revivable, attr, css, data } = analyze(instructions);
  if (revivable) {
    parsedString += `;self._defineSet();`;
  }

  return treeShake(
    readFileSync(getTemplateFile(__dirname, type), { encoding })
      .replace(select('revive', revivable), '')
      .replace(select('NodeType', revivable || attr || css), '')
      .replace('/*! main-code-goes-here */', `((node) => { self.node = ${parsedString}; })(self.docElm);`)
      .replace(select('any\-dynamic', revivable), '')
      .replace(select('browser\-dynamic', revivable && !isSSR), '')
      .replace(select('server\-dynamic', revivable && isSSR), '')
      .replace(select('nodejs', (revivable && isSSR) || type === 'code'), '')
      .replace(select('data', data), '')
      .replace('/*!funcs go here*/', functions)
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
      return `${template}.es.js`;
    default:
      return `${template}.js`;
  }
}

function treeShake(code: string) {
  return findFeatures(code)
    .reduce(
      (code: string, feature: string) => code.replace(select(`shakeable ${feature}`, isFeatureUsed(code, feature)), ''),
      code
    );
}

function isFeatureUsed(code: string, feature: string): boolean {
  return (code.match(new RegExp(`${feature} = function|${feature}\\(|${feature}.bind`, 'gm')) || []).length > 1;
}

function findFeatures(code: string): string[] {
  const featureFinder: RegExp = /\/\*!shakeable (\w*){\*\/\n/g;
  const features: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = featureFinder.exec(code)) !== null) {
    features.push(match[1]);
  }

  return features;
}
