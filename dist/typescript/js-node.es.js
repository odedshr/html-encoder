import { lib } from './js-node.lib.js';
const { 
/*!shakeable {*/ addToSet, attachSetToNode, clone, getAddedChildren, getHTMLNode, getPrecedingOrSelf, getSubTemplate, getValue, initExitingElement, iterate, setDomParser, setDocument, updateToStringMethod /*!} shakeable*/ } = lib;
/*!nodejs{*/
import { DOMParser } from '@xmldom/xmldom';
const document = (new DOMParser()).parseFromString('<html></html>', 'text/xml');
const window = { DOMParser: DOMParser, document };
/*!}nodejs*/
lib.setDomParser(new window.DOMParser());
lib.setDocument(window.document);
export class JSNode {
    constructor(data, nodeToRevive) {
        return nodeToRevive ? initNode(nodeToRevive) : getNode(data);
    }
}
export function getNode(data = {}) {
    return buildNode(data);
}
export function initNode(existingNode) {
    return buildNode({}, existingNode);
}
function buildNode(data, nodeToRevive) {
    const set = {};
    const funcs = { /*!funcs go here*/};
    const node = nodeToRevive ? initExitingElement(data, set, funcs, nodeToRevive) : initNewNode(data, set, funcs);
    updateToStringMethod(node);
    return node;
}
function initNewNode(data, set, funcs) {
    //@ts-ignore returned value might be DocumentFragment which isn't a childNode, which might cause tsc to complain
    const node = document.createTextNode('main-code-goes-here');
    return node;
}
//# sourceMappingURL=js-node.es.js.map