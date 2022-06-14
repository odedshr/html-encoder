"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initNode = exports.getNode = exports.JSNode = void 0;
const js_node_lib_js_1 = require("./js-node.lib.js");
const { 
/*!shakeable {*/ addToSet, attachSetToNode, clone, getAddedChildren, getHTMLNode, getPrecedingOrSelf, getSubTemplate, getValue, initExitingElement, iterate, setDomParser, setDocument, updateToStringMethod /*!} shakeable*/ } = js_node_lib_js_1.lib;
/*!nodejs{*/
const xmldom_1 = require("@xmldom/xmldom");
const document = (new xmldom_1.DOMParser()).parseFromString('<html></html>', 'text/xml');
const window = { DOMParser: xmldom_1.DOMParser, document };
/*!}nodejs*/
js_node_lib_js_1.lib.setDomParser(new window.DOMParser());
js_node_lib_js_1.lib.setDocument(window.document);
class JSNode {
    constructor(data, nodeToRevive) {
        return nodeToRevive ? initNode(nodeToRevive) : getNode(data);
    }
}
exports.JSNode = JSNode;
function getNode(data = {}) {
    return buildNode(data);
}
exports.getNode = getNode;
function initNode(existingNode) {
    return buildNode({}, existingNode);
}
exports.initNode = initNode;
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
//# sourceMappingURL=js-node.js.map