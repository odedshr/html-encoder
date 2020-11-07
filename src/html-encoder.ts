import NodeParser from './html-to-json';
import { transpile as toESCode, TargetType as ESTypes } from './typescript/index';

export type TargetType = 'json' | ESTypes;

export default function htmlEncoder(html: string, type: TargetType = 'js', isSSR = false) {
  return transpile(new NodeParser(html, type === 'ts'), type, isSSR);
}

function transpile(parser: NodeParser, type: TargetType, isSSR: boolean) {
  if (type === 'json') {
    return parser.toString();
  }

  return toESCode(parser.getJSON(), type, isSSR);
}