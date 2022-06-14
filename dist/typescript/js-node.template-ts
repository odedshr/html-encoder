import { KeyedObject, NodeWithSet, State, FunctionMap, lib } from './js-node.lib.js';
const {
  /*!shakeable {*/addToSet,
  attachSetToNode,
  clone,
  getAddedChildren,
  getHTMLNode,
  getPrecedingOrSelf,
  getSubTemplate,
  getValue,
  initExitingElement,
  iterate,
  setDomParser,
  setDocument,
  updateToStringMethod/*!} shakeable*/
} = lib;

/*!nodejs{*/
import { DOMParser } from '@xmldom/xmldom';
const document: Document = (new DOMParser()).parseFromString('<html></html>', 'text/xml');
const window = { DOMParser: DOMParser, document };
/*!}nodejs*/
lib.setDomParser(new window.DOMParser());
lib.setDocument(window.document);

export class JSNode {
  constructor(data: KeyedObject, nodeToRevive?: ChildNode) {
    return nodeToRevive ? initNode(nodeToRevive) : getNode(data);
  }
}

export function getNode(data: KeyedObject = {}): NodeWithSet {
  return buildNode(data);
}

export function initNode(existingNode: ChildNode): Node {
  return buildNode({}, existingNode);
}

function buildNode(data: KeyedObject, nodeToRevive?: ChildNode): NodeWithSet {
  const set: State = {};
  const funcs: FunctionMap = {/*!funcs go here*/ };
  const node: ChildNode = nodeToRevive ? initExitingElement(data, set, funcs, nodeToRevive) : initNewNode(data, set, funcs);

  updateToStringMethod(node);
  return node as unknown as NodeWithSet;
}

function initNewNode(data: KeyedObject, set: State, funcs: FunctionMap): ChildNode {
  //@ts-ignore returned value might be DocumentFragment which isn't a childNode, which might cause tsc to complain
  const node = document.createTextNode('main-code-goes-here');
  return node;
}