import { DOMParser } from '@xmldom/xmldom';

import { readFileSync } from 'fs';
import { Instruction, Attribute, LoopInstruction, endSubRoutineTag } from './instruction';

const domParser = new DOMParser();
const encoding = 'utf-8';

const NodeType = {
  Element: 1,
  Attribute: 2,
  Text: 3,
  CDATA: 4,
  EntityReference: 5,
  Entity: 6,
  ProcessingInstruction: 7,
  Comment: 8,
  Document: 9,
  DocumentType: 10,
  DocumentFragment: 11,
  Notation: 12,
};

export default class NodeParser {
  rootNode: Document;
  instruction: Instruction = { type: 'document' };
  functions: string[] = [];
  isTypescript: boolean;
  counter: number = 0;

  constructor(html: string, isTypescript: boolean) {
    const document: Document = domParser.parseFromString(html.replace(/\n\s+>/g, '>'), 'text/xml');
    this.rootNode = document;
    this.isTypescript = isTypescript;

    if (!document || !document.firstChild) {
      // couldn't find any content;
      this.instruction = { type: 'documentFragment' };
    } else {
      const children: ChildNode[] = Array.from(document.childNodes);
      const docType: Instruction | false | undefined =
        children[0].nodeType === NodeType.DocumentType ? this.parseNode(children.shift() as ChildNode) : false;

      if (children.length > 1) {
        // multiple elements on root level
        this.instruction.type = 'documentFragment';
        this.instruction.children = children.map((node) => this.parseNode(node));
      } else {
        const child = children.pop();
        if (child) {
          this.instruction = this.parseNode(child);
        }
      }

      if (docType) {
        if (this.instruction.type === 'documentFragment') {
          // multiple elements, all going to be under document
          docType.children = this.instruction.children;
        } else {
          // just a single element to be under document
          docType.children = [this.instruction];
        }
        this.instruction = docType;
      }
    }
  }

  private parseNode(node: ChildNode): Instruction {
    switch (node.nodeType) {
      case NodeType.DocumentType:
        return this.parseDocumentType(<DocumentType>node);
      // case NodeType.Document:
      // case NodeType.DocumentFragment:
      //   return node.firstChild ? this.parseNode(node.firstChild) : { type: 'documentFragment' };
      case NodeType.ProcessingInstruction:
        return this.parseProcessInstruction(<ProcessingInstruction>node);
      case NodeType.Text:
        return this.parseTextElement(node);
      case NodeType.Comment:
        return this.parseCommentElement(node);
      default:
        return this.parseHtmlElement(<HTMLElement>node);
    }
  }

  private parseProcessInstruction(node: ProcessingInstruction): Instruction {
    const tag = node.target;
    const value = node.nodeValue || '';
    const instruction: Instruction = {
      type: 'ProcessingInstruction', tag
    };
    let liveId: string | false = false;

    if (tag.indexOf('?') === 0) {
      instruction.tag = 'if';
      liveId = this.getLiveId(tag.substring(1), value);
      instruction.value = this.cleanTag(tag);
      instruction.attributes = {
        functionName: this.toCamelCase(`if ${[instruction.value, liveId].join('').replace(/\W/g, ' ')}${this.counter++}`)
      };
    } else if (tag.match(/.+@.+/)) {
      instruction.tag = 'foreach';
      liveId = this.getLiveId(tag, value);
      instruction.attributes = this.parseLoop(tag, liveId || '');
    } else if (['/', '/@', '/?'].indexOf(tag) > -1) {
      if (tag !== '/') {
        console.error(`"${tag}" is deprecated and will be replaced with a simple "/".`)
      }
      instruction.tag = endSubRoutineTag;
    } else if (tag.indexOf('css') === 0) {
      instruction.tag = 'css';
      instruction.value = this._getCssInstructions(value.split(/\s/));
    } else if (tag.indexOf(':') === 0) {
      instruction.tag = 'template';
      const isImportedFile = /^(["'])(.*)\1$/.exec(tag.substring(1));
      if (isImportedFile) {
        instruction.children = [(new NodeParser(readFileSync(isImportedFile[2], encoding), this.isTypescript)).getJSON()];
      } else {
        instruction.value = tag.substring(1);
      }
    } else
      if (tag.indexOf('attr') === 0) {
        instruction.tag = 'attr';
        instruction.attributes = this._getAttributeInstructions(value.split(/\s/));
      } else if (tag.indexOf('==') === 0) {
        instruction.tag = 'html';
        instruction.value = this.cleanTag(tag);
        liveId = this.getLiveId(tag.substring(2), value);
      } else if (tag.indexOf('=') === 0) {
        instruction.tag = 'text';
        instruction.value = this.cleanTag(tag);
        liveId = this.getLiveId(tag.substring(1), value);
      } else if (value && value.length) {
        instruction.value = value;
      }

    if (liveId) {
      instruction.id = liveId;
    }
    return instruction;
  }

  private cleanTag(tag: string) {
    return tag.replace(/^[\?=]+/, '').replace(/#$/, '');
  }

  private getLiveId(tag: string, value: string): string | false {
    if (value && value.indexOf('#') > -1) {
      return value.substring(1);
    } else if (tag.indexOf('#') > -1) {
      return tag.split('@').pop()?.replace(/#$/, '') || false;
    }

    return false;
  }

  private parseDocumentType(node: DocumentType): Instruction {
    return { type: 'document', attributes: { name: node.name, publicId: node.publicId, systemId: node.systemId } };
  }

  private parseTextElement(node: ChildNode): Instruction {
    return { type: 'text', value: node.textContent || '' };
  }

  private parseCommentElement(node: ChildNode): Instruction {
    return { type: 'comment', value: node.textContent || '' };
  }

  private parseHtmlElement(node: HTMLElement): Instruction {
    const attributes = this.getAttributes(node);
    const children = this.parseChildren(node);
    const instruction: Instruction = { type: 'element', tag: node.tagName };

    if (Object.keys(attributes).length) {
      instruction.attributes = attributes;

      if (attributes.id) {
        instruction.id = attributes.id;
      }
    }
    if (children.length) {
      instruction.children = children;
    }

    return instruction;
  }

  parseLoop(loopInstruction: string, id: string): LoopInstruction {
    const [iteratorAndIndex, variable] = loopInstruction.replace(/#$/, '').split('@');
    const [iterator, index = '$i'] = iteratorAndIndex.split(':');
    const functionName = this.toCamelCase(`forEach ${[variable, iterator, index, id].join('').replace(/\W/g, ' ')}${this.counter++}`);
    return { variable, iterator, index, functionName };
  }

  private toCamelCase(str: string) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match: string, index: number) {
      if (+match === 0) {
        return ""; // or if (/\s+/.test(match)) for white spaces
      }
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
  }

  private getAttributes(node: HTMLElement): { [key: string]: string } {
    const output: { [key: string]: string } = {};

    Array.from(node.attributes || []).forEach((attr: Attr) => {
      const key = attr.nodeName || '';
      const value = attr.nodeValue || '';
      //TODO: live
      //this.rememberForEasyAccess(attr, element);
      output[key] = value;
    });

    return output;
  }

  private parseChildren(node: HTMLElement): Instruction[] {
    const childNodes = Array.from(node.childNodes || []);
    const stack: Instruction[][] = [];
    let children: Instruction[] = [] as Instruction[];

    // console.debug(`-- parsing ${node.tagName}: ${this._getChildrenDescription(childNodes)}`);

    childNodes.forEach((childNode: ChildNode) => {
      const parsed = this.parseNode(childNode);

      if (['foreach', 'if'].indexOf(parsed.tag || '') > -1) {
        children.push(parsed);
        stack.push(children);

        //from now on, add to the subroutines' children list;
        if (!parsed.children) {
          parsed.children = [];
        }
        children = parsed.children;
      } else if (endSubRoutineTag === parsed.tag) {
        const loopParent = stack.pop();

        if (!loopParent) {
          throw Error(`end of subRoutine without start: ${this.getChildrenDescription(childNodes)}`);
        }
        children = loopParent;
      } else {
        children.push(parsed);
      }
    });

    return children;
  }

  private getChildrenDescription(children: ChildNode[]): string {
    return JSON.stringify(
      children.map((node) => {
        switch (node.nodeType) {
          case NodeType.ProcessingInstruction:
            return (<ProcessingInstruction>node).target;
          case NodeType.Text:
            return `t{${node.textContent}}`;
          case NodeType.Comment:
            return `t{${node.textContent}}`;
          default:
            return (<HTMLElement>node).tagName;
        }
      })
    );
  }

  _parseAttrValue(value: string) {
    // value is `condition?attrName=varName`
    const matches = value.match(/((.+)\?)?([^=.]+)(=(.+))?/) || [];
    const condition = matches[2];
    const variable = matches[5];
    let id = this._extractLiveId(matches[3]);
    let attrName = matches[3].split('#')[0];

    return { condition, attrName, variable, id };
  }

  _extractLiveId(attrName: string) {
    if (attrName.indexOf('#') > -1) {
      const liveId = attrName.split('#')[1];

      if (liveId.length) {
        return liveId;
      } else {
        return attrName.substring(0, attrName.indexOf('#'));
      }
    }
    return false;
  }

  _getAttributeInstructions(attributes: string[]): { [key: string]: Attribute } {
    const output: { [key: string]: any } = {};

    attributes.forEach((attrValue) => {
      const { condition, attrName, variable, id } = this._parseAttrValue(attrValue);

      output[attrName] = {};
      if (condition) {
        output[attrName].condition = condition;
      }

      if (variable) {
        output[attrName].variable = variable.replace(/[\'"]/g, "'");
      }

      if (id) {
        output[attrName].id = id;
      }
    });

    return output;
  }

  // value is `condition?cssName`
  _getCssInstructions(classes: string[]): (Attribute | string)[] {
    return classes.map((attrValue) => this._parseCssValue(attrValue));
  }

  _parseCssValue(value: string): string | Attribute {
    // value is `condition?varName` or `condition?varName#liveId` or `condition?'hardcoded'`
    const matches = value.match(/((.+)\?)?([^#]+)(#(.*?))??/) || [];

    const attribute: Attribute = { variable: matches[3] };
    if (matches[2]) {
      attribute.condition = matches[2];
    }
    if (value.indexOf('#') > -1) {
      attribute.id = matches[5] || matches[3];
    }

    return Object.keys(attribute).length === 1 ? matches[3] : attribute;
  }

  getJSON() {
    return this.instruction;
  }

  toString(): string {
    return JSON.stringify(this.instruction);
  }

  getFunctions(): string {
    return this.functions.join(',\n');
  }
}
