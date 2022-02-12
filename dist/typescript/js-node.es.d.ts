export declare type KeyedObject = {
    [key: string]: any;
};
export declare type Property = {
    type: 'text' | 'html' | 'attribute' | 'foreach' | 'if';
    node: Node;
    attrName?: string;
    details?: subRoutineInstructions;
};
declare type subRoutineInstructions = {
    startAt: number;
    fn: (value: any) => ChildNode[][];
    fnName: string;
    items?: any;
    flag?: boolean;
    nodes?: ChildNode[][];
};
export interface NodeWithSet extends Node {
    set: {
        [key: string]: Property[];
    };
}
export declare function getNode(/*!data{*/ data?: KeyedObject /*!}data*/): NodeWithSet;
export declare function initNode(existingNode: ChildNode): Node;
export default class JSNode {
    /*!any-dynamic{*/ set: {
        [key: string]: Property[];
    }; /*!}any-dynamic*/
    /*!data{*/ data: {
        [key: string]: any;
    }; /*!}data*/
    node: ChildNode;
    docElm: Document;
    /*!funcs{*/ funcs: {
        [key: string]: Function;
    }; /*!}funcs*/
    constructor(data: KeyedObject, nodeToRevive?: ChildNode /*!}revive*/ /*!}data*/);
    private updateToStringMethod;
    private fillNode;
    private getDocElm;
    /*!shakeable _setDocumentType{*/
    protected _setDocumentType(name: string, publicId: string, systemId: string): void;
    /*!}shakeable _setDocumentType*/
    /*!any-dynamic{*/
    register(key: string, value: Property): void;
    protected _defineSet(): void;
    /*!}any-dynamic*/
    /*!shakeable _getSubTemplate{*/
    _getSubTemplate(templateName: string): any;
    /*!}shakeable _getSubTemplate*/
    /*!shakeable _forEach{*/
    _forEach(iteratorName: string, indexName: string, parent: Node, fn: Function, list: any): ChildNode[][];
    /*!}shakeable _forEach*/
    /*!shakeable _getValue{*/
    _getValue(data: KeyedObject, path: string, expects?: 'template' | 'string' | 'any'): any;
    /*!shakeable _setValue{*/
    _setValue(data: KeyedObject, path: string, value: any): void;
    /*!}shakeable _setValue*/
    /*!shakeable _getHTMLNode{*/
    _getHTMLNode(htmlString: string | HTMLElement): HTMLElement | Text;
}
export {};
/*!}shakeable getPrecedingOrSelf*/ 
