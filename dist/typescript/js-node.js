"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initNode = exports.getNode = void 0;
const NodeType = {
    Element: 1,
    Comment: 8,
    Document: 9,
};
// feature server-reactivity
const xmldom_1 = require("@xmldom/xmldom");
const window = { DOMParser: xmldom_1.DOMParser };
// feature server-reactivity end
function getNode(data = {}) {
    return new JSNode(data);
}
exports.getNode = getNode;
function initNode(existingNode) {
    return new JSNode({}, existingNode);
}
exports.initNode = initNode;
class JSNode {
    constructor(data, existingNode) {
        this.set = {};
        this.funcs = {};
        this.domParser = new window.DOMParser();
        this.docElm = this.getDocElm();
        this.data = data;
        if (existingNode) {
            this.node = this.initExitingElement(existingNode);
        }
        else {
            this.node = this.fillNode();
        }
        const self = this;
        const originalToString = this.node.toString;
        this.node.toString = () => self.fixHTMLTags(originalToString.call(this.node));
        return this.node;
    }
    initExitingElement(node) {
        const self = this;
        if (node.nodeType === NodeType.Document) {
            Array.from(node.childNodes)
                .filter((child) => !!child.setAttribute)
                .forEach((child) => initChild(self, child));
        }
        else {
            initChild(self, node);
        }
        // feature browser-reactivity
        addReactiveFunctionality(node, this.set, this.domParser);
        // feature browser-reactivity end
        return node;
    }
    fillNode() {
        const self = this;
        //docElm is used by injected code
        const docElm = this.docElm;
        // main code goes here:
        //@ts-ignore returned value might be DocumentFragment which isn't a childNode, which might cause tsc to complain
        (node => {
            console.log(self, node);
        })(docElm);
        // end of main code
        return this.node;
    }
    getDocElm() {
        return typeof document !== 'undefined' ? document : this.domParser.parseFromString('<html></html>', 'text/xml');
    }
    // shakeable _setDocumentType
    _setDocumentType(name, publicId, systemId) {
        const nodeDoctype = this.docElm.implementation.createDocumentType(name, publicId, systemId);
        if (this.docElm.doctype) {
            this.docElm.replaceChild(nodeDoctype, this.docElm.doctype);
        }
        else {
            this.docElm.insertBefore(nodeDoctype, this.docElm.childNodes[0]);
        }
        // removing empty <html/> and adding this.node instead; I got an error when I tried to use replaceChild here
        this.docElm.removeChild(this.docElm.childNodes[1]);
        this.docElm.appendChild(this.node);
        //@ts-ignore
        this.node = this.docElm;
    }
    // shakeable _setDocumentType end
    // feature reactivity
    register(key, value) {
        if (!this.set[key]) {
            this.set[key] = [];
        }
        this.set[key].push(value);
    }
    _defineSet() {
        if (Object.keys(this.set).length) {
            addReactiveFunctionality(this.node, this.set, this.domParser);
        }
    }
    // feature reactivity end
    // shakeable _getSubTemplate
    _getSubTemplate(templateName) {
        const self = this;
        const Template = self._getValue(this.data, templateName);
        return new Template(this.data);
    }
    // shakeable _getSubTemplate end
    // shakeable _forEach
    _forEach(iteratorName, indexName, parent, fn, list) {
        const self = this;
        const orig = {
            iterator: self._getValue(this.data, iteratorName),
            index: self._getValue(this.data, indexName),
        };
        const items = [];
        for (let id in list) {
            self._setValue(this.data, indexName, id);
            self._setValue(this.data, iteratorName, list[id]);
            getAddedChildren(parent, fn).forEach(item => items.push(item));
        }
        self._setValue(this.data, iteratorName, orig.iterator);
        self._setValue(this.data, indexName, orig.index);
        return items;
    }
    // shakeable _forEach end
    // shakeable _getValue
    _getValue(data, path) {
        if (path.match(/^(['"].*(\1))$/)) {
            return path.substring(1, path.length - 1);
        }
        return path[0] === '!'
            ? !this._getValue(data, path.substr(1))
            : path.split('.').reduce(function (ptr, step) {
                return ptr && ptr.hasOwnProperty(step) ? ptr[step] : undefined;
            }, data);
    }
    // shakeable _getValue end
    // shakeable _setValue
    _setValue(data, path, value) {
        const pathParts = path.split('.');
        const varName = pathParts.pop();
        if (varName) {
            pathParts.reduce(function (ptr, step) {
                return ptr && ptr.hasOwnProperty(step) ? ptr[step] : undefined;
            }, data)[varName] = value;
        }
    }
    // shakeable _setValue end
    // shakeable _getHTMLNode
    _getHTMLNode(htmlString) {
        if (!(typeof htmlString === 'string')) {
            return htmlString;
        }
        if (!htmlString.match(/<(.*?)>.*<\/(\1)>/)) {
            return this.docElm.createTextNode(htmlString);
        }
        else if (!htmlString.match(/^<(.*?)>.*<\/(\1)>$/)) {
            // htmlString is text that has html tags in it, we need to wrap it
            htmlString = `<span>${htmlString.replace(/& /g, '&amp; ')}</span>`;
        }
        try {
            return this.domParser.parseFromString(htmlString, 'text/xml').firstChild;
        }
        catch (err) {
            console.error(`failed to parse string: ${htmlString}`, err);
            return this.docElm.createTextNode(htmlString);
        }
    }
    // shakeable _getHTMLNode end
    // shakeable fixHTMLTags
    fixHTMLTags(xmlString) {
        return xmlString.replace(/\<(?!area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)([a-z|A-Z|_|\-|:|0-9]+)([^>]*)\/\>/gm, '<$1$2></$1>');
    }
}
exports.default = JSNode;
// functions goes here
// shakeable getAddedChildren
function getAddedChildren(parent, fn) {
    const items = [];
    const beforeChildCount = parent.childNodes.length;
    fn();
    const afterChildCount = parent.childNodes.length;
    for (let i = beforeChildCount; i < afterChildCount; i++) {
        items.push(parent.childNodes.item(i));
    }
    return [items];
}
// shakeable getAddedChildren end
// shakeable clone
function clone(item) {
    return typeof item === 'object' ? Object.freeze(Array.isArray(item) ? [...item] : Object.assign({}, item)) : item;
}
// shakeable clone end
function initChild(self, node) {
    let stack = [];
    Array.from(node.childNodes || [])
        .forEach((child) => {
        var _a;
        if (child.nodeType === NodeType.Comment) {
            const value = ((_a = child.nodeValue) === null || _a === void 0 ? void 0 : _a.split(/\s/g)) || [''];
            if (value[0].indexOf('PI:') === 0 && value[0] !== 'PI:forEachItem') {
                if (isInstructionWithChildren(value[0])) {
                    stack.push([child]);
                }
                else {
                    processServerRenderedProcessInstruction(self, getPrecedingOrSelf(node), [child]);
                }
                return;
            }
            else if (value[0].indexOf('/PI:') === 0 && stack.length) {
                stack[stack.length - 1].push(child);
                processServerRenderedProcessInstruction(self, node, stack.pop() || []);
                return;
            }
        }
        else if (child.nodeType === NodeType.Element) {
            const nodeId = child.getAttribute('id');
            nodeId && self.register(nodeId, { type: 'html', node: getPrecedingOrSelf(node) });
        }
        if (stack.length) {
            stack[stack.length - 1].push(child);
        }
        else {
            initChild(self, child);
        }
    });
}
function isInstructionWithChildren(comment) {
    return ['text', 'html', 'foreach', 'if'].indexOf(comment.substr(3)) > -1;
}
function safeRemove(parent, child) {
    if (child) {
        parent.removeChild(child);
    }
}
function processServerRenderedProcessInstruction(self, parent, children) {
    var _a;
    const value = (((_a = children[0]) === null || _a === void 0 ? void 0 : _a.nodeValue) || '').split(/\s/g);
    safeRemove(parent, children.shift());
    safeRemove(parent, children.pop());
    const firstValue = value.shift();
    switch (firstValue) {
        case 'PI:text':
            return self.register(value[0], { type: 'text', node: children.pop() });
        case 'PI:html':
            return self.register(value[0], { type: 'html', node: children.pop() });
        case 'PI:css':
            return value
                .map(str => str.split(':'))
                .map(([id, className]) => self.register(id, { type: 'attribute', node: parent, attrName: 'class' }));
        case 'PI:attr':
            return value
                .map(str => str.split(':'))
                .map(([id, attrName]) => {
                const pattern = id.match(/^{(.*)}=(.*)$/);
                self.register(pattern ? pattern[2] : id, { type: 'attribute', node: parent, attrName });
            });
        case 'PI:foreach':
            {
                const [id, /* varName */ , fnName] = value;
                const items = {};
                const nodes = [];
                const startAt = indexOfChild(parent.childNodes, children[0]);
                children.forEach(child => {
                    var _a, _b;
                    const nodeValue = ((_a = child.nodeValue) === null || _a === void 0 ? void 0 : _a.split(' ')) || [];
                    if (child.nodeType === NodeType.Comment && fnName === nodeValue[1]) {
                        const [/*PI*/ , /* fnName */ , key, value] = nodeValue;
                        items[key] = value;
                        nodes.push([]);
                        (_b = child.parentNode) === null || _b === void 0 ? void 0 : _b.removeChild(child);
                    }
                    else {
                        nodes[nodes.length - 1].push(child);
                    }
                });
                const fn = self.funcs[fnName].bind({}, self, self.docElm, parent);
                self.register(id, {
                    type: 'foreach',
                    node: parent,
                    details: { startAt: startAt, items: getArrayIfPossible(items), nodes, fn, fnName },
                });
            }
            return;
        case 'PI:if':
            {
                const startAt = indexOfChild(parent.childNodes, children[0]);
                const [varName, fnName] = value;
                const nodes = [children];
                const fn = self.funcs[fnName].bind({}, self, self.docElm, parent);
                self.register(varName, {
                    type: 'if',
                    node: parent,
                    details: { startAt: +startAt, flag: !!nodes.length, nodes, fn, fnName },
                });
            }
            return;
        default:
            console.error('Unidentified PI:', firstValue);
    }
}
// if all keys are consecutive integers from 0 and forward, then return an array
function getArrayIfPossible(items) {
    const arr = [];
    const keys = Object.keys(items);
    const count = keys.length;
    for (let i = 0; i < count; i++) {
        if (+keys[i] !== i) {
            return items;
        }
        arr.push(items[i]);
    }
    return arr;
}
// feature reactivity
function addReactiveFunctionality(node, set = {}, domParser) {
    Object.defineProperty(node, 'set', {
        value: getSetProxy(set, domParser),
        configurable: true,
        writable: true,
    });
}
function getSetProxy(map, domParser) {
    return new Proxy(map, {
        get: function (map, prop) {
            var _a, _b;
            if (map[prop] === undefined) {
                return undefined;
            }
            // we may have multiple connectors to this prop, we'll only fetch the value from the first one:
            const property = map[prop][0];
            if (property) {
                switch (property.type) {
                    case 'text':
                        return property.node.textContent;
                    case 'html':
                        return property.node;
                    case 'attribute':
                        return property.attrName && property.node.getAttribute(property.attrName);
                    case 'foreach':
                        return (_a = property === null || property === void 0 ? void 0 : property.details) === null || _a === void 0 ? void 0 : _a.items;
                    case 'if':
                        return (_b = property === null || property === void 0 ? void 0 : property.details) === null || _b === void 0 ? void 0 : _b.flag;
                }
            }
        },
        set: function (map, prop, value) {
            if (map[prop] === undefined) {
                throw new Error(`property '${prop}' not found`);
            }
            map[prop].forEach((property) => {
                switch (property.type) {
                    case 'text':
                        property.node.data = value;
                        break;
                    case 'html':
                        try {
                            const newNode = typeof value === 'string' ? domParser.parseFromString(value, 'text/xml') : value;
                            if (property.node && property.node.parentNode) {
                                property.node.parentNode.replaceChild(newNode, property.node);
                            }
                            property.node = newNode;
                        }
                        catch (err) {
                            throw new Error(`failed to replace node to ${value} (${err})`);
                        }
                        break;
                    case 'attribute':
                        if (property.attrName) {
                            // single attribute
                            if (value === null) {
                                property.node.removeAttribute(property.attrName);
                            }
                            else {
                                property.node.setAttribute(property.attrName, value);
                            }
                        }
                        else {
                            // attribute map
                            Object.keys(value).forEach((attrName) => property.node.setAttribute(attrName, value[attrName]));
                        }
                        break;
                    case 'foreach':
                        updateLoop(property, value);
                        break;
                    case 'if':
                        updateConditional(property, value);
                        break;
                }
            });
            return true;
        },
    });
}
// items are groups of nodes, we want to count the number of nodes insides groups until index
function countElementsUntilIndex(items, index) {
    const count = Math.min(index, items.length);
    let acc = 0;
    for (let i = 0; i < count; i++) {
        acc += items[i].length;
    }
    return acc;
}
function updateLoop(property, value) {
    if (property.details) {
        const parent = property.node;
        const { fn, items, nodes = [], startAt } = property.details;
        const instructions = diff(items, value);
        const removedChildren = instructions.removed.map((i) => {
            nodes[i].forEach((node) => parent.removeChild(node));
            return nodes[i];
        });
        fn(instructions.added).forEach((children) => nodes.push(children));
        // updatedNodes has added nodes at the end, so we know where they are, but it will cause issues on second iteration
        const updatedNodes = nodes.filter((group) => !removedChildren.includes(group));
        // orderedNodes will keep the nodes in the right order
        const orderedNodes = [];
        instructions.positions.forEach((i, newIndex) => {
            orderedNodes.push(updatedNodes[i]);
            if (newIndex !== -1) {
                const newP = countElementsUntilIndex(updatedNodes, newIndex);
                if (startAt + newP < parent.childNodes.length) {
                    const sibling = parent.childNodes.item(startAt + newP);
                    if (updatedNodes[i] && (sibling !== updatedNodes[i][0])) {
                        updatedNodes[i].forEach((child) => parent.insertBefore(child, sibling));
                    }
                }
            }
        });
        property.details.nodes = orderedNodes;
        property.details.items = clone(value);
    }
}
function toMap(source) {
    const map = new Map();
    if (Array.isArray(source)) {
        return new Map(source.map((v, k) => [k, v]));
    }
    else {
        return new Map(Object.keys(source).map(k => [k, source[k]]));
    }
}
function findIndex(map, item, placed) {
    let index = 0;
    for (let [key, targetItem] of map) {
        if (targetItem === item && !placed.get(key)) {
            return index;
        }
        index++;
    }
}
function diff(source, target) {
    const sourceMap = toMap(source);
    const targetMap = toMap(target);
    const placed = new Map([...targetMap.keys()].map(key => ([key, false])));
    const toPosition = [];
    const output = {
        removed: [],
        added: Array.isArray(target) ? [] : {},
        positions: [],
    };
    // set existing items to either removed or new positions
    let index = 0;
    for (let [, item] of sourceMap) {
        const position = findIndex(targetMap, item, placed);
        if (position === undefined) {
            output.removed.push(index);
        }
        else {
            toPosition.push(position);
            placed.set(position, true);
        }
        index++;
    }
    output.removed = output.removed.sort().reverse();
    // write new item positions
    index = 0;
    for (let [key, item] of targetMap) {
        if (!placed.get(key)) {
            toPosition.push(index);
            if (Array.isArray(output.added)) {
                output.added.push(item);
            }
            else {
                output.added[key] = item;
            }
        }
        index++;
    }
    // toPosition is [index]=>target-position, but I want to know who goes to target-position
    // so I transpose the array;
    toPosition.forEach((target, index) => {
        output.positions[target] = index;
    });
    return output;
}
function indexOfChild(childNodes, child) {
    return Array.prototype.indexOf.call(childNodes, child);
}
function updateConditional(property, value) {
    if (property.details) {
        const parent = property.node;
        let updatedNodes = [];
        const { fn = () => [], flag, nodes = [], startAt } = property.details;
        if (flag && !value) {
            while (nodes[0].length) {
                const child = nodes[0].pop();
                child && parent.removeChild(child);
            }
        }
        else if (!flag && value) {
            updatedNodes = fn(value);
            if (parent.childNodes.length < startAt) {
                property.details.startAt = parent.childNodes.length - updatedNodes[0].length;
            }
            else {
                const sibling = parent.childNodes.item(startAt);
                updatedNodes[0].forEach((node) => {
                    if (indexOfChild(parent.childNodes, node) !== startAt) {
                        parent.insertBefore(node, sibling);
                    }
                });
            }
        }
        property.details.nodes = updatedNodes;
        property.details.flag = value;
    }
}
// feature reactivity end
// shakeable getSubroutineChildren
function getSubroutineChildren(node, attribute) {
    const output = {};
    Array.from(node.childNodes).forEach((child) => {
        if (child.hasAttribute(attribute)) {
            const [key, collection] = (child.getAttribute(attribute) || '').split('|');
            if (!output[key]) {
                output[key] = [];
            }
            if (!output[key][+collection]) {
                output[key][+collection] = [];
            }
            output[key][+collection].push(child);
        }
    });
    return output;
}
// shakeable getSubroutineChildren end
// shakeable getPrecedingOrSelf
function getPrecedingOrSelf(elm) {
    //@ts-ignore (ts doesn't like Array.from)
    const children = Array.from(elm.childNodes);
    children.reverse().filter(child => child.nodeType !== NodeType.Comment);
    return (children.find(child => child.nodeType === NodeType.Element) || elm);
}
// shakeable getPrecedingOrSelf end
//# sourceMappingURL=js-node.js.map