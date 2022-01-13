"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xmldom_1 = require("@xmldom/xmldom");
const fs_1 = require("fs");
const instruction_1 = require("./instruction");
const domParser = new xmldom_1.DOMParser();
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
class NodeParser {
    constructor(html, isTypescript) {
        this.instruction = { type: 'document' };
        this.functions = [];
        this.counter = 0;
        const document = domParser.parseFromString(html.replace(/\n\s+>/g, '>'), 'text/xml');
        this.rootNode = document;
        this.isTypescript = isTypescript;
        if (!document || !document.firstChild) {
            // couldn't find any content;
            this.instruction = { type: 'documentFragment' };
        }
        else {
            const children = Array.from(document.childNodes);
            const docType = children[0].nodeType === NodeType.DocumentType ? this.parseNode(children.shift()) : false;
            if (children.length > 1) {
                // multiple elements on root level
                this.instruction.type = 'documentFragment';
                this.instruction.children = children.map((node) => this.parseNode(node));
            }
            else {
                const child = children.pop();
                if (child) {
                    this.instruction = this.parseNode(child);
                }
            }
            if (docType) {
                if (this.instruction.type === 'documentFragment') {
                    // multiple elements, all going to be under document
                    docType.children = this.instruction.children;
                }
                else {
                    // just a single element to be under document
                    docType.children = [this.instruction];
                }
                this.instruction = docType;
            }
        }
    }
    parseNode(node) {
        switch (node.nodeType) {
            case NodeType.DocumentType:
                return this.parseDocumentType(node);
            // case NodeType.Document:
            // case NodeType.DocumentFragment:
            //   return node.firstChild ? this.parseNode(node.firstChild) : { type: 'documentFragment' };
            case NodeType.ProcessingInstruction:
                return this.parseProcessInstruction(node);
            case NodeType.Text:
                return this.parseTextElement(node);
            case NodeType.Comment:
                return this.parseCommentElement(node);
            default:
                return this.parseHtmlElement(node);
        }
    }
    parseProcessInstruction(node) {
        const tag = node.target;
        const value = node.nodeValue || '';
        const instruction = {
            type: 'ProcessingInstruction', tag
        };
        let liveId = false;
        if (tag.indexOf('?') === 0) {
            instruction.tag = 'if';
            liveId = this.getLiveId(tag.substr(1), value);
            instruction.value = this.cleanTag(tag);
            instruction.attributes = {
                functionName: this.toCamelCase(`if ${[instruction.value, liveId].join('').replace(/\W/g, ' ')}${this.counter++}`)
            };
        }
        else if (tag.match(/.+@.+/)) {
            instruction.tag = 'foreach';
            liveId = this.getLiveId(tag, value);
            instruction.attributes = this.parseLoop(tag, liveId || '');
        }
        else if (['/@', '/?'].indexOf(tag) > -1) {
            instruction.tag = instruction_1.endSubRoutineTag;
        }
        else if (tag.indexOf('css') === 0) {
            instruction.tag = 'css';
            instruction.value = this._getCssInstructions(value.split(/\s/));
        }
        else if (tag.indexOf(':') === 0) {
            instruction.tag = 'template';
            const isImportedFile = /^(["'])(.*)\1$/.exec(tag.substr(1));
            if (isImportedFile) {
                instruction.children = [(new NodeParser((0, fs_1.readFileSync)(isImportedFile[2], encoding), this.isTypescript)).getJSON()];
            }
            else {
                instruction.value = tag.substr(1);
            }
        }
        else if (tag.indexOf('attr') === 0) {
            instruction.tag = 'attr';
            instruction.attributes = this._getAttributeInstructions(value.split(/\s/));
        }
        else if (tag.indexOf('==') === 0) {
            instruction.tag = 'html';
            instruction.value = this.cleanTag(tag);
            liveId = this.getLiveId(tag.substr(2), value);
        }
        else if (tag.indexOf('=') === 0) {
            instruction.tag = 'text';
            instruction.value = this.cleanTag(tag);
            liveId = this.getLiveId(tag.substr(1), value);
        }
        else if (value && value.length) {
            instruction.value = value;
        }
        if (liveId) {
            instruction.id = liveId;
        }
        return instruction;
    }
    cleanTag(tag) {
        return tag.replace(/^[\?=]+/, '').replace(/#$/, '');
    }
    getLiveId(tag, value) {
        var _a;
        if (value && value.indexOf('#') > -1) {
            return value.substring(1);
        }
        else if (tag.indexOf('#') > -1) {
            return ((_a = tag.split('@').pop()) === null || _a === void 0 ? void 0 : _a.replace(/#$/, '')) || false;
        }
        return false;
    }
    parseDocumentType(node) {
        return { type: 'document', attributes: { name: node.name, publicId: node.publicId, systemId: node.systemId } };
    }
    parseTextElement(node) {
        return { type: 'text', value: node.textContent || '' };
    }
    parseCommentElement(node) {
        return { type: 'comment', value: node.textContent || '' };
    }
    parseHtmlElement(node) {
        const attributes = this.getAttributes(node);
        const children = this.parseChildren(node);
        const instruction = { type: 'element', tag: node.tagName };
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
    parseLoop(loopInstruction, id) {
        const [iteratorAndIndex, variable] = loopInstruction.replace(/#$/, '').split('@');
        const [iterator, index = '$i'] = iteratorAndIndex.split(':');
        const functionName = this.toCamelCase(`forEach ${[variable, iterator, index, id].join('').replace(/\W/g, ' ')}${this.counter++}`);
        return { variable, iterator, index, functionName };
    }
    toCamelCase(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
            if (+match === 0) {
                return ""; // or if (/\s+/.test(match)) for white spaces
            }
            return index === 0 ? match.toLowerCase() : match.toUpperCase();
        });
    }
    getAttributes(node) {
        const output = {};
        Array.from(node.attributes || []).forEach((attr) => {
            const key = attr.nodeName || '';
            const value = attr.nodeValue || '';
            //TODO: live
            //this.rememberForEasyAccess(attr, element);
            output[key] = value;
        });
        return output;
    }
    parseChildren(node) {
        const childNodes = Array.from(node.childNodes || []);
        const stack = [];
        let children = [];
        // console.debug(`-- parsing ${node.tagName}: ${this._getChildrenDescription(childNodes)}`);
        childNodes.forEach((childNode) => {
            const parsed = this.parseNode(childNode);
            if (['foreach', 'if'].indexOf(parsed.tag || '') > -1) {
                children.push(parsed);
                stack.push(children);
                //from now on, add to the subroutines' children list;
                if (!parsed.children) {
                    parsed.children = [];
                }
                children = parsed.children;
            }
            else if (instruction_1.endSubRoutineTag === parsed.tag) {
                const loopParent = stack.pop();
                if (!loopParent) {
                    throw Error(`end of subRoutine without start: ${this.getChildrenDescription(childNodes)}`);
                }
                children = loopParent;
            }
            else {
                children.push(parsed);
            }
        });
        return children;
    }
    getChildrenDescription(children) {
        return JSON.stringify(children.map((node) => {
            switch (node.nodeType) {
                case NodeType.ProcessingInstruction:
                    return node.target;
                case NodeType.Text:
                    return `t{${node.textContent}}`;
                case NodeType.Comment:
                    return `t{${node.textContent}}`;
                default:
                    return node.tagName;
            }
        }));
    }
    _parseAttrValue(value) {
        // value is `condition?attrName=varName`
        const matches = value.match(/((.+)\?)?([^=.]+)(=(.+))?/) || [];
        const condition = matches[2];
        const variable = matches[5];
        let id = this._extractLiveId(matches[3]);
        let attrName = matches[3].split('#')[0];
        return { condition, attrName, variable, id };
    }
    _extractLiveId(attrName) {
        if (attrName.indexOf('#') > -1) {
            const liveId = attrName.split('#')[1];
            if (liveId.length) {
                return liveId;
            }
            else {
                return attrName.substring(0, attrName.indexOf('#'));
            }
        }
        return false;
    }
    _getAttributeInstructions(attributes) {
        const output = {};
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
    _getCssInstructions(classes) {
        return classes.map((attrValue) => this._parseCssValue(attrValue));
    }
    _parseCssValue(value) {
        // value is `condition?varName` or `condition?varName#liveId` or `condition?'hardcoded'`
        const matches = value.match(/((.+)\?)?([^#]+)(#(.*?))??/) || [];
        const attribute = { variable: matches[3] };
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
    toString() {
        return JSON.stringify(this.instruction);
    }
    getFunctions() {
        return this.functions.join(',\n');
    }
}
exports.default = NodeParser;
//# sourceMappingURL=html-to-json.js.map