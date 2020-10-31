import { Instruction, Attribute, LoopInstruction } from './instruction';
export default class NodeParser {
    rootNode: Document;
    instruction: Instruction;
    functions: string[];
    isTypescript: boolean;
    counter: number;
    constructor(html: string, isTypescript: boolean);
    private parseNode;
    private parseProcessInstruction;
    private cleanTag;
    private getLiveId;
    private parseDocumentType;
    private parseTextElement;
    private parseCommentElement;
    private parseHtmlElement;
    parseLoop(loopInstruction: string, id: string): LoopInstruction;
    private toCamelCase;
    private getAttributes;
    private parseChildren;
    private getChildrenDescription;
    _parseAttrValue(value: string): {
        condition: string;
        attrName: string;
        variable: string;
        id: string | false;
    };
    _extractLiveId(attrName: string): string | false;
    _getAttributeInstructions(attributes: string[]): {
        [key: string]: Attribute;
    };
    _getCssInstructions(classes: string[]): (Attribute | string)[];
    _parseCssValue(value: string): string | Attribute;
    getJSON(): Instruction;
    toString(): string;
    getFunctions(): string;
}
