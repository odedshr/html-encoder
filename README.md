# HTML Encoder

[![Build Status](https://travis-ci.org/odedshr/html-encoder.svg?branch=master)](https://travis-ci.org/odedshr/html-encoder-core)

[![license](https://img.shields.io/badge/license-ISC-brightgreen.svg)](https://github.com/odedshr/html-encoder/blob/master/LICENSE)

## The Main Gist

HTML-Encoder converts your template HTML file to JSON instructions that can be piped to a JavaScript/TypeScript function (henceforth JSNode).
The file can then be embedded in either server-side or client-side code. It's pretty much like [JSX](https://reactjs.org/docs/introducing-jsx.html) or [Svelete](https://svelte.dev/).

See a live example at the [showcase](https://odedshr.github.io/html-encoder-showcase/).

### Installing

```bash
  npm install html-encoder
```

### Usage

```typescript
  import htmlEncoder, { TargetType } from 'html-encoder';

  const xmlString:string = '<html>...</html>';
  const targetType?:TargetType = 'js';
  const isServerSide?:boolean = false;
  const codeFile:string = htmlEncoder(xmlString, targetType, isServerSide);

/**
* Generates a string of instructions how to recreate the provided XML
* @param string xmlString - can be simple text string, but it if it's XML (HTML or SVG, for example) it'll be parsed accordingly
* @param TargetType targetType - supported output type. Current available statuses are 
* - json
* - code (outputs the actual function, ready to be used)
* - js (javascript string)
* - es ("js" file but in ES6 format),
* - es-code (outputs actual function, ready to be used as a module)
* - ts (typescript)
* @param boolean isServerSide - a flag indicating whether code should include additional comments that will help the file become dynamic once sent to the browser
* @return string - instructions to recreate the HTML.
*/
```

Standard JS output is [commonJS](https://medium.com/@cgcrutch18/commonjs-what-why-and-how-64ed9f31aa46#:~:text=CommonJS%20is%20a%20module%20formatting,heavily%20influenced%20NodeJS's%20module%20management.)-compliant; Should you wish to have a [ESNext](https://www.javascripttutorial.net/es-next/), you can use the type `es`.

A simple usage example:

```javascript
import htmlEncoder from 'html-encoder';
const Node = htmlEncoder('<div>Hello <?=name?></div>','code');

document.appendChild(new Node({name:'World'}));
```

### How to use the output

Once the returned string is saved, you can then easily embed by importing it to your code and appending the node to the DOM tree:

```javascript
import { getNode } from 'login-screen.template.js';

document.appendChild(getNode());
```

## Dynamic Content Support

`HTML-encoder` supports dynamic content using [`XML-processing-instructions`](https://en.wikipedia.org/wiki/Processing_Instruction) and passing an object of data to the constructor (e.g. `getNode({divClass: 'highlighted', src: './portfolio.png' })`).

These instructions are applied to their preceding sibling tag or parent if no preceding tag available. For example for the data

```javascript
<div><?css divClass?><img /></div>  // => add css class to div

<div><img  /><?attr src=src?></div>  // => add `src` attribute to img
```

Let's see example in action:

template.html:

```html
<div>
  <?css parent?><b>Hello</b
  ><?css sibling?>
</div>
```

```javascript
import { getNode } from './file.template';

console.log(getNode({ parent: 'foo', sibling: 'bar' }).toString);

// output: <div class="foo"><b class="bar">Hello</b></div>
```

### Content

- `<?=text?>` - Append a textNode with the html-safe content of the variable `text`.

- `<?==html?>` - Append a parsed node with the content of the variable `html`;

The input may be either a text or a pre-compiled node / HTML Element.

### Conditionals

- `<??condition>xxx<?/?>` - Add its content only if the variable `condition` is truthy.

- `<??!condition>xxx<?/?>` - Add its content only if the variable `condition` is falsy.

### Loops

- `<?value@array?><li><?=value?></li></?@?>` - Iterate over an array allowing access to its elements.

- `<?value:key@array?><li><?=key?> <?=value?></li></?@?>` - Iterate over an array allowing access to its elements and provide their index-number (starting from zero)

- `<?value:key@object?><li><?=key?> <?=value?></li></?@?>` - Iterate over a key-value object.

### Attributes

- `<?attr key=varName?>` - Set the attribute `key` with the value of `varName`.

- `<?attr key=value key2=value2?>` - Set as many attributes as provided.

- `<?attr map?>` - Set a collection of attributes described in the variable `map`, which should be key-value object (e.g. `{ val1: 'bar', val2: 'foo' }`)

- `<?attr condition?key=value?>` - Set attribute `key` only if the variable `condition` is truthy.

- `<?attr !condition?key=value?>` - Set attribute `key` only if the variable `condition` is falsy.

- `<?attr condition?map?>` - Set a collection of attributes only if the variable `condition` is truthy.

- `<?attr !condition?map?>` - Set a collection of attributes only if the variable `condition` is falsy.

### CSS Classes

- `<?css value?>` - Add the css-class or array-of-classes provided in `value` (i.e. `value: 'highlighted'` or `value: ['primary','pressed']`)

- `<?css condition?value?>` - Add the css-class or array-of-classes provided in `value` if the variable `condition` is truthy.

## Sub-Templates

- `<?:templateName?>` - Use another template. For example:

liTemplate:

```html
<li><?=v?></li>
```

ulTemplate:

```html
<ul>
  <?v@items?><?:LiTemplate?><?/?>
</ul>
```

Javascript:

```javascript
import { Node as LiTemplate } from './liTemplate';
import { Node as UlTemplate } from './ulTemplate';
console.log(new UlTemplate({ items: ['a', 'b', 'c'], LiTemplate }).toString());
```

Output:

```html
<ul>
  <li>a</li>
  <li>b</li>
  <li>c</li>
</ul>
```

- `<?:'./import-file.svg'?>` - embeds a file as part of the template. The file can be free-text or xml-based (HTML, XML, SVG) that will then be parsed automatically. Note that unlike other process-instruction, this PI is being handled at compile-time. For example:

```html
<div class="image"><?:"./images/svg_logo.svg"?></div>
```

Output:

```xml
<div class="image"><svg width="100" height="100">
   <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow"></circle>
   Sorry, your browser does not support inline SVG.
</svg></div>
```

## Easy-access to Content

### Using id (`<img id="foo" />`)

Any HTML elements with an `id` attribute can easily be access at `node.set[id]`, for example:

template.html:

```html
<button  id="cta">Foo</div>
```

javascript:

```javascript
const  node = getNode();

node.set.cta.addEventListener('click', ... );
```

You can even replace the node entirely and the reference will point to the new element.

```javascript
node.set.cta = new ButtonTemplate({label:'login'});
node.set.cta.addEventListener('click', ... );
```

### Creating references to dynamic data

text nodes and html nodes that were added using `<?=text#?>` and `<?==html#?>` can also have quick-access, by adding a `#id` suffix. For example:

template.html:

```html
<div>
  Hello
  <?=firstName#?>
</div>
```

javascript:

```javascript
const node = getNode({ firstName: 'Adam' });

console.log(node.toString()); // output `<div>Hello Adam</div>`

node.set.firstName = 'Ben';

console.log(node.toString()); // output `<div>Hello Ben</div>`
```

The reference shares the variable-name that is used, but it can also differ:

1. `<?=text #id?> => node.set.id` - Create a textNode and update its value
2. `<?==html #id?> => node.set.id` - Create a node and update its value with either text or node

When setting `#id` to an html, it's the same effect as defining an `id` attribute to the element (as previously described) and similarly it allows replacing the entire node.

If the same `#id` is used twice, only the last reference will stay relevant.

### Setting references to attributes

Similarly you can create a reference to a specific attribute:

1. `<?attr href#=url?>` creates a reference at `node.set.href` and set initial value from `url`
2. `<?attr href#link=url?>` creates a reference at `node.set.link` with the initial value
3. `<?attr value#{variable}=key?>` creates a reference where the alias named is also a variable. for example, the data `{variable:'link', key:'localhost' }` the following statement will be true `node.set.link === 'localhost`
4. `<?attr attributeMap#?>` create an easy attribute-map setter `node.set.attributeMap = { attr1:'foo', attr2: 'bar' }`

It's important to note that the reference aren't independent variables, rather then reference so changes in the values will be reflected automatically:

```html
<div><input type="text" id="field" value="initial" /><?attr value#name=value?></div>
```

```javascript
node.set.field.value = 'hello'; //node.set.field refers to the input HTML element

console.log(node.set.name); // outputs 'hello
```

### Easy-access to content with Server-Side-Rendering

`node.set` can provide easy access to the code but it's only available when the node was rendered in the browser.

In order to support [Server-Side-Rendering](https://medium.com/@baphemot/whats-server-side-rendering-and-do-i-need-it-cb42dc059b38) (SSR), we can leave enough cues that can later be picked up to reconstruct a new `node.set`

The output of `<?out:ssr ... ?>`, it will provide these additional cues that we can later reconnect using the `initNode` function:

```javascript
import { initNode } from './MyComponent.template';

const myForm = initNode(document.getElementById('feedbackForm'));

console.log(myForm.set.starCount); // should have the reference to the value;
```

## The idea behind the project The HTML

The native HTML `<template>` element can be useful when (a) we have repetitive HTML content; or (b) when we're introducing new content. But because of the static nature of HTML which doesn't really support any data-binding on its own, the `template` element becomes meaningless:

I believe that there is a conceptual flaw with HTML `<template >` element (or maybe it is I who failed to find a reasonable tutorial how to use it properly): `<template >` tags are meant to help having dynamic content in the page by providing the template as base, but as long as it is handled using javascript and not a pure-browser-native code, it must be encoded (for performance sake) to javascript before being used, and if the translation occurs at the browser-side then by definition it'll effect performance.

### How could it have worked natively

1. `<template>` tag should have a `data-bind` attribute, which is then connected to a javascript variable hold an object (or array of objects) with fields that will be populated natively. For example:

   ```html
   `<template data-bind="names"><li data-bind="name"></li></template>`
   ```

   would be displayed as `<li>Alex</li> <li>Ben</li>` And wouldn't it be wonderful if whenever names variable would change the html would refresh itself automatically?

2. If we could `data-bind-src` a URL with either JSON or XML data to be natively parsed into our template. But in all fairness, we don't need a `template` tag for that, we just need the html `bind` attribute.

   This would work great for pseudo-static HTML files (in the sense that there's no Javascript required for the page to function).

   And should we want a dynamic page perhaps we could pick the TemplateElement and use its `clone(data)` method to populate it with our data, so the usage would be:

   ```javascript

   const template = document.selectById("myTemplate");

   document.selectById("myParent").appendChild(template.clone(data, isWatchingData)

   ```

Without native-browser-based data-population and without javascript-less support, the `template` tags are utter pointless.

### JSX as a template alternative

[JSX](https://medium.com/javascript-scene/jsx-looks-like-an-abomination-1c1ec351a918) is another kind of template. In essence, is a pseudo-html code written within JS code and then pre-compiled to pure JS which is served to the browser. Syntax-wise it's very similar to HTML (with a couple of small exception such as `className`) and it has no "smart logic" (such as loops and conditionals) because it doesn't need it - it lives inside JS code.
The problem with it that it translates to code that requires React, which you will be forced to include in your project.

```
  <div /> => /* @__PURE__ */ React.createElement("div", null);
```

Quite Similarly, [Svelte](https://gist.github.com/Rich-Harris/0f910048478c2a6505d1c32185b61934) translates html to js code. It has "smart logic" using handlebars. It's a much more efficient way to write template but I don't like it, because in order to write proper JSX you need to proficient in both HTML and Javascript and for me it feels like a mix of responsibilities: HTML provides the structure to our page, while javascript provides computability and these are two different things from my point of view. I believe this separation of concern is bound to result in better code.

### This is where the html-encoder comes in

I would like to write a normal HTML file but empower it with a `data-bind` attribute without any additional javascript programming (it would have been nice to do so natively but that's just wishful thinking) and this HTML can be pre-compiled on the server and served as a static page (dynamic-content is bonus). The `HTML encoder` does exactly that:

1. You write a normal HTML file

2. Import it to your javascript code using `import { getNode } from './example.template';` and then use it by appending it to the DOM -`document.appendChild(getNode());`

### The `<?...?>` tag

A guiding principle was to write an HTML valid code, but this raised the question - "Where can we place the computational instructions (aka the smart logic) required?" and I found the Process Instructions (PI for short). they look a bit ugly I must admit -`<? ... ?>` but for the proof-of-concept they serve their purpose. Looking at other template systems such as [Vue](https://medium.com/@Pier/vue-js-the-good-the-meh-and-the-ugly-82800bbe6684), the PIs are attributes in the elements or new html-invalid elements (i.e. not part of the HTML language), While the `<? ... ?>` is a valid HTML element.

## Cheat-sheet

1. `<?=text?>`creates a textNode with the content of the variable named`text`.
2. `<?==html?>`creates an HTML element with the content of`html`, which can be either an HTML element or a string that will be parsed as HTML.
3. Conditions: `<??condition?>xxx<?/?>`will add the content only if condition is true. A boolean-negate (`!`) is also available so `<??!condition?>xxx<?/?>` will add the content only if condition is false.
4. Loops: `<?item:index@items?>xxx<?/?>`will iterate over items (either an array or an object) providing the key and value and the given variable names (in the example it would be `item` and `index` )
5. Attributes: `<?attr key1=varName1 key2=varName2?>`will set the attributes in preceding element `<?attr attrObject?>` will set the attributes described in the `attrObject` (e.g. `<img/><?attr attrMap?> // attrMap={ src: "...", alt: "...", width: ...}` )
6. CSS classes: `<?css varName?>`will set the class(es) described in the variable that can be either a string or an array. it's also possible to condition a class by writing `<?class condition?varName?>`.
7. SubTemplates: When a subTemplates' class is provided with the data it can be used with`<?:subTemplateVarName?>`
8. Editable content: you can access nodes and attributes via `node.set.XXX` -
   - All elements that have an id (e.g. `<img id="editable" />` => `node.set.editable.src="..."`)
   - `<?=text#?>` => `node.set.text = 'hello world'`
   - `<?==text␣#value?>` => `node.set.value = 'hello world'`
   - `<??condition#?>xxx<?/?>` => `node.set.condition = true`
   - `<??condition␣#flag?>xxx<?/?>` => `node.set.flag = false`
   - `<?item:index@items#?>xxx<?/?>` => `node.set.items = [...]`
   - `<?item:index@items␣#value?>xxx<?/?>` => `node.set.value = [...]`
   - `<?attr attrMap#?>` => `node.set.attrMap = { ...};`
   - `<?attr value#=data?>` => `node.set.value = "foo";`
   - `<?attr value#{varName}=data?> / { data: 2, varName: "key"}` => `node.set.key = 3;`
