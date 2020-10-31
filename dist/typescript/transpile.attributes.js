"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttributes = void 0;
function getAttributes(attributes) {
    const instructions = [];
    Object.keys(attributes).forEach((attrName) => {
        const value = attributes[attrName];
        if (typeof (value) === 'string') {
            // hard-coded
            instructions.push(`node.setAttribute('${attrName}', '${value}');`);
            if (attrName === 'id') {
                // easy access to element using the id
                instructions.push(`self.register('${value}', { node, type: 'html' });`);
            }
        }
        else {
            // dynamic 
            const { condition = false, variable, id = false } = value;
            if (condition) {
                instructions.push(`if (self._getValue(self.data, '${condition}')) {`);
            }
            if (variable) {
                instructions.push(`node.setAttribute('${attrName}', self._getValue(self.data, '${variable.replace(/[\'"]/g, "\\'")}'));`);
                if (id) {
                    const pattern = id.match(/^{(.*)}$/); // checking if id is not variable to be read
                    const liveId = pattern ? `self._getValue(self.data, '${pattern[1]}')` : `'${id}'`;
                    instructions.push(`self.register(${liveId}, { node, type: 'attribute', 'attrName': '${attrName}'});`);
                }
            }
            else {
                if (id) {
                    instructions.push(`self.register('${id}',{ node, type: 'attribute' });`);
                }
                //no variable provided; setting attributeMap
                const addToLiveList = id
                    ? `\nself.register(\`${id}#\${k}\`, { node, type: 'attribute', 'attrName': k });`
                    : '';
                instructions.push(`{
          const tmpAttrs = self._getValue(self.data, '${attrName}');
          for (let k in tmpAttrs) {
            node.setAttribute(k, tmpAttrs[k]);${addToLiveList}
          }
        }`);
            }
            if (condition) {
                instructions.push('}');
            }
        }
    });
    return instructions.join('\n');
}
exports.getAttributes = getAttributes;
//# sourceMappingURL=transpile.attributes.js.map