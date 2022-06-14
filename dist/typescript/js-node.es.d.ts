import { KeyedObject, NodeWithSet } from './js-node.lib.js';
export declare class JSNode {
    constructor(data: KeyedObject, nodeToRevive?: ChildNode);
}
export declare function getNode(data?: KeyedObject): NodeWithSet;
export declare function initNode(existingNode: ChildNode): Node;
