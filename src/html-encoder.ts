import NodeParser from './html-to-json';
import { transpile as toESCode, TargetType as ESTypes } from './typescript/index';

export type TargetType = 'json' | ESTypes;

/**
* Generates a string of instructions how to recreate the provided XML
* @param string xmlString - can be simple text string, but it if it's XML (HTML or SVG, for example) it'll be parsed accordingly
* @param TargetType targetType - supported output type. Current available statuses are json, js (javascript), es ("js" file but in ES6 format) and ts (typescript)
* @param boolean isServerSide - a flag indicating whether code should include additional comments that will help the file become dynamic once sent to the browser
* @return string - instructions to recreate the HTML.
*/
export default function htmlEncoder(html: string, type: TargetType = 'js', isSSR = false) {
  const parser = new NodeParser(html, type === 'ts');

  if (type === 'json') {
    return parser.toString();
  }

  return toESCode(parser.getJSON(), type, isSSR);
}