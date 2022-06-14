export declare type KeyedObject = { [key: string]: any };
// this is called "State" (and not "Set") because "Set" is a reserved word
export declare type State = { [key: string]: Property[] };
export declare type FunctionMap = { [key: string]: Function };
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

const NodeType = {
  Element: 1,
  Comment: 8,
  Document: 9,
};
export interface NodeWithSet extends Node {
  set: State
}

let domParser: DOMParser;
let document: Document;

function setDomParser(importedDomParser: DOMParser) {
  domParser = importedDomParser;
}

function setDocument(importedDocument: Document) {
  document = importedDocument;
}

function updateToStringMethod(node: ChildNode) {
  const originalToString = node.toString;
  node.toString = () => fixHTMLTags(originalToString.call(node));
}

function getHTMLNode(htmlString: string | HTMLElement) {
  if (!(typeof htmlString === 'string')) {
    return htmlString;
  }

  if (!htmlString.match(/<(.*?)>.*<\/(\1)>/)) {
    return document.createTextNode(htmlString);
  } else if (!htmlString.match(/^<(.*?)>.*<\/(\1)>$/)) {
    // htmlString is text that has html tags in it, we need to wrap it
    htmlString = `<span>${htmlString.replace(/& /g, '&amp; ')}</span>`;
  }

  try {
    return <HTMLElement>domParser.parseFromString(htmlString, 'text/xml').firstChild;
  } catch (err) {
    console.error(`failed to parse string: ${htmlString}`, err);
    return document.createTextNode(htmlString);
  }
}

function fixHTMLTags(xmlString: string) {
  return xmlString.replace(
    /\<(?!area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)([a-z|A-Z|_|\-|:|0-9]+)([^>]*)\/\>/gm,
    '<$1$2></$1>'
  );
}

function addToSet(set: State, key: string, value: Property) {
  if (!set[key]) {
    set[key] = [];
  }
  set[key].push(value);
}

function attachSetToNode(set: State, node: ChildNode) {
  if (Object.keys(set).length) {
    addReactiveFunctionality(node, set);
  }
}

function getAddedChildren(parent: Node, fn: Function): ChildNode[][] {
  const items = [];
  const beforeChildCount = parent.childNodes.length;
  fn();
  const afterChildCount = parent.childNodes.length;

  for (let i = beforeChildCount; i < afterChildCount; i++) {
    items.push(parent.childNodes.item(i));
  }

  return [items];
}

function clone(item: any) {
  return typeof item === 'object' ? Object.freeze(Array.isArray(item) ? [...item] : { ...item }) : item;
}

function initExitingElement(data: KeyedObject, set: State, funcs: FunctionMap, node: ChildNode) {
  if (node.nodeType === NodeType.Document) {
    Array.from(node.childNodes)
      .filter((child: ChildNode) => !!(<HTMLElement>child).setAttribute)
      .forEach((child: ChildNode) => initChild(data, set, funcs, <HTMLElement>child));
  } else {
    initChild(data, set, funcs, <Element>node);
  }

  addReactiveFunctionality(<Element>node, set);

  return node;
}

function initChild(data: KeyedObject, set: State, funcs: FunctionMap, node: Node) {
  let stack: Node[][] = [];

  Array.from(node.childNodes || [])
    .forEach((child: ChildNode) => {
      if (child.nodeType === NodeType.Comment) {
        const value = child.nodeValue?.split(/\s/g) || [''];
        if (value[0].indexOf('PI:') === 0 && value[0] !== 'PI:forEachItem') {
          if (isInstructionWithChildren(value[0])) {
            stack.push([child]);
          } else {
            processServerRenderedProcessInstruction(data, set, funcs, getPrecedingOrSelf(node), [child]);
          }
          return;
        } else if (value[0].indexOf('/PI:') === 0 && stack.length) {
          stack[stack.length - 1].push(child);
          processServerRenderedProcessInstruction(data, set, funcs, node, stack.pop() || []);
          return;
        }
      } else if (child.nodeType === NodeType.Element) {
        const nodeId = (child as HTMLElement).getAttribute('id');
        nodeId && addToSet(set, nodeId, { type: 'html', node: getPrecedingOrSelf(node) });
      }

      if (stack.length) {
        stack[stack.length - 1].push(child);
      } else {
        initChild(data, set, funcs, child);
      }
    });
}

function isInstructionWithChildren(comment: string) {
  return ['text', 'html', 'foreach', 'if'].indexOf(comment.substring(3)) > -1;
}

function safeRemove(parent: Node, child?: Node) {
  if (child) {
    parent.removeChild(child);
  }
}
function processServerRenderedProcessInstruction(data: KeyedObject, set: State, funcs: FunctionMap, parent: Node, children: Node[]) {
  const value = (children[0]?.nodeValue || '').split(/\s/g);

  safeRemove(parent, children.shift());
  safeRemove(parent, children.pop());
  const firstValue = value.shift();
  switch (firstValue) {
    case 'PI:text':
      return addToSet(set, value[0], { type: 'text', node: <Element>children.pop() });
    case 'PI:html':
      return addToSet(set, value[0], { type: 'html', node: <Element>children.pop() });
    case 'PI:css':
      return value
        .map(str => str.split(':'))
        .map(([id, className]) => addToSet(
          set, id,
          { type: 'attribute', node: parent, attrName: 'class' }));
    case 'PI:attr':
      return value
        .map(str => str.split(':'))
        .map(([id, attrName]) => {
          const pattern = id.match(/^{(.*)}=(.*)$/);

          addToSet(
            set,
            pattern ? pattern[2] : id,
            { type: 'attribute', node: parent, attrName });
        });
    case 'PI:foreach':
      {
        const [id, /*! varName */, fnName] = value;
        const items: { [key: string]: any } = {};
        const nodes: ChildNode[][] = [];
        const startAt = indexOfChild(parent.childNodes, children[0] as ChildNode);

        children.forEach(child => {
          const nodeValue = child.nodeValue?.split(' ') || [];
          if (child.nodeType === NodeType.Comment && fnName === nodeValue[1]) {
            const [/*!PI*/, /*! fnName */, key, value] = nodeValue;
            items[key] = value;
            nodes.push([]);
            child.parentNode?.removeChild(child);
          } else {
            nodes[nodes.length - 1].push(child as ChildNode);
          }
        });

        const fn = funcs[fnName].bind({}, parent);

        addToSet(set, id, {
          type: 'foreach',
          node: parent,
          details: { startAt: startAt, items: getArrayIfPossible(items), nodes, fn, fnName },
        });
      }
      return;
    case 'PI:if':
      {
        const startAt = indexOfChild(parent.childNodes, children[0] as ChildNode);
        const [varName, fnName] = value;
        const nodes: ChildNode[][] = [children as ChildNode[]];
        const fn = funcs[fnName].bind({}, parent);

        addToSet(set, varName, {
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

function getArrayIfPossible(items: { [key: string]: any }) {
  const arr: any[] = [];
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

function addReactiveFunctionality(node: ChildNode, set: { [key: string]: Property[] } = {}) {
  Object.defineProperty(node, 'set', {
    value: getSetProxy(set),
    configurable: true,
    writable: true,
  });
}

function getSetProxy(map: { [key: string]: Property[] }) {
  return new Proxy(map, {
    get: function (map, prop: string) {
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
            return property.attrName && (<Element>property.node).getAttribute(property.attrName);
          case 'foreach':
            return property?.details?.items;
          case 'if':
            return property?.details?.flag;
        }
      }
    },
    set: function (map: KeyedObject, prop: string, value: any) {
      if (map[prop] === undefined) {
        throw new Error(`property '${prop}' not found`);
      }
      map[prop].forEach((property: Property) => {
        switch (property.type) {
          case 'text':
            (<any>property.node).data = value;
            break;
          case 'html':
            try {
              const newNode = typeof value === 'string' ? domParser.parseFromString(value, 'text/xml') : value;
              if (property.node && property.node.parentNode) {
                property.node.parentNode.replaceChild(newNode, property.node);
              }
              property.node = newNode;
            } catch (err) {
              throw new Error(`failed to replace node to ${value} (${err})`);
            }
            break;
          case 'attribute':
            if (property.attrName) {
              // single attribute
              if (value === null) {
                (property.node as Element).removeAttribute(property.attrName);
              } else {
                (property.node as Element).setAttribute(property.attrName, value);
              }
            } else {
              // attribute map
              Object.keys(value).forEach((attrName) => (property.node as Element).setAttribute(attrName, value[attrName]));
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
function countElementsUntilIndex(items: ChildNode[][], index: number) {
  const count = Math.min(index, items.length);
  let acc = 0;
  for (let i = 0; i < count; i++) {
    acc += items[i].length;
  }
  return acc;
}

function updateLoop(property: Property, value: any) {
  if (property.details) {
    const parent = property.node;
    const { fn, items, nodes = [], startAt } = property.details;

    const instructions: DiffInstructions = diff(items, value);

    const removedChildren: ChildNode[][] = instructions.removed.map((i) => {
      nodes[i].forEach((node) => parent.removeChild(node));
      return nodes[i];
    });

    fn(instructions.added).forEach((children: any) => nodes.push(children));

    // updatedNodes has added nodes at the end, so we know where they are, but it will cause issues on second iteration
    const updatedNodes = nodes.filter((group: ChildNode[]) => !removedChildren.includes(group));
    // orderedNodes will keep the nodes in the right order
    const orderedNodes: ChildNode[][] = [];

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

type DiffInstructions = {
  removed: number[];
  added: any[] | { [key: string]: any };
  positions: number[];
};

function toMap(source: any[] | { [key: string]: any }): Map<string | number, any> {
  const map = new Map();
  if (Array.isArray(source)) {
    return new Map(source.map((v, k) => [k, v]));
  } else {
    return new Map(Object.keys(source).map(k => [k, source[k]]));
  }
}

function findIndex(map: Map<string | number, any>, item: any, placed: Map<string | number, boolean>) {
  let index = 0;
  for (let [key, targetItem] of map) {
    if (targetItem === item && !placed.get(key)) {
      return index;
    }
    index++;
  }
}

function diff(source: any[] | { [key: string]: any }, target: any[] | { [key: string]: any }): DiffInstructions {
  const sourceMap = toMap(source);
  const targetMap = toMap(target);
  const placed: Map<string | number, boolean> = new Map([...targetMap.keys()].map(key => ([key, false])));

  const toPosition: number[] = [];

  const output: DiffInstructions = {
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
    } else {
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
      } else {
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

function indexOfChild(childNodes: NodeListOf<ChildNode>, child: ChildNode) {
  return Array.prototype.indexOf.call(childNodes, child);
}


function updateConditional(property: Property, value: boolean) {
  if (property.details) {
    const parent = property.node;
    let updatedNodes: ChildNode[][] = [];
    const { fn = () => [], flag, nodes = [], startAt } = property.details;

    if (flag && !value) {
      // was true, now false, remove elements
      while (nodes[0] && nodes[0].length) {
        const child = nodes[0].pop();
        child && parent.removeChild(child);
      }
    } else if (!flag && value) {
      // was false, now true, add elements
      updatedNodes = fn(value);

      if (parent.childNodes.length < startAt) {
        // less children than expected, update startAt to new value
        property.details.startAt = parent.childNodes.length - updatedNodes[0].length;
      } else {
        // out of all the siblings, move the added elements to their proper location
        const sibling = parent.childNodes.item(startAt);
        updatedNodes[0].forEach((node, i) => {
          if (indexOfChild(parent.childNodes, node) !== (startAt + i)) {
            parent.insertBefore(node, sibling);
          }
        });
      }
    }

    property.details.nodes = updatedNodes;
    property.details.flag = value;
  }
}

function getPrecedingOrSelf(elm: Node): HTMLElement {
  const children = Array.from(elm.childNodes);
  children.reverse().filter(child => child.nodeType !== NodeType.Comment);

  return (children.find(child => child.nodeType === NodeType.Element) || elm) as HTMLElement;
}

function getValue(data: KeyedObject, path: string, expects: 'template' | 'string' | 'any' = 'any'): any {
  if (path.match(/^(['"].*(\1))$/)) {
    return path.substring(1, path.length - 1);
  }
  let value: any = path.replace(/^\!/, '').split('.').reduce(function (ptr: KeyedObject, step: string) {
    return ptr && ptr.hasOwnProperty(step) ? ptr[step] : undefined;
  }, data);

  if ((expects !== 'template') && value instanceof Function) {
    value = value();
  }
  if ((expects === 'string') && typeof (value) === 'object') {
    value = (value.toString && value.toString() !== '[object Object]') ? value.toString() : JSON.stringify(value);
  }

  return path[0] === '!' ? !value : value;
}

function getSubTemplate(data: KeyedObject, templateName: string) {
  const Template = getValue(data, templateName, 'template');
  return new Template(data);
}

function setValue(data: KeyedObject, path: string, value: any) {
  const pathParts = path.split('.');
  const varName = pathParts.pop();
  if (varName) {
    pathParts.reduce(function (ptr: { [key: string]: any }, step) {
      return ptr && ptr.hasOwnProperty(step) ? ptr[step] : undefined;
    }, data)[varName] = value;
  }
}

function iterate(data: KeyedObject, iteratorName: string, indexName: string, parent: Node, fn: Function, list: any): ChildNode[][] {
  const orig = {
    iterator: getValue(data, iteratorName),
    index: getValue(data, indexName),
  };
  const items: ChildNode[][] = [];

  for (let id in list) {
    setValue(data, indexName, id);
    setValue(data, iteratorName, list[id]);
    getAddedChildren(parent, fn).forEach(item => items.push(item));
  }
  setValue(data, iteratorName, orig.iterator);
  setValue(data, indexName, orig.index);
  return items;
}

export const lib = {
  addToSet,
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
  updateToStringMethod
};
