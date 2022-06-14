import { Attribute } from '../instruction';

export function getAttributes(attributes: { [key: string]: string | Attribute }): string {
  const instructions: string[] = [];

  Object.keys(attributes).forEach((attrName) => {
    const value = attributes[attrName];

    if (typeof (value) === 'string') {
      // hard-coded
      instructions.push(
        `node.setAttribute('${attrName}', '${value}');`
      );
      if (attrName === 'id') {
        // easy access to element using the id
        instructions.push(`addToSet(set, '${value}', { node, type: 'html' });`);
      }
    } else {
      // dynamic 
      const { condition = false, variable, id = false } = value;

      if (condition) {
        instructions.push(`if (getValue(data, '${condition}')) {`);
      }

      if (variable) {
        instructions.push(
          `node.setAttribute('${attrName}', getValue(data, '${variable.replace(/[\'"]/g, "\\'")}'));`
        );
        if (id) {
          const pattern = id.match(/^{(.*)}$/); // checking if id is not variable to be read
          const liveId = pattern ? `getValue(data, '${pattern[1]}')` : `'${id}'`;
          instructions.push(`addToSet(set, ${liveId}, { node, type: 'attribute', 'attrName': '${attrName}'});`);
        }
      } else {
        if (id) {
          instructions.push(`addToSet(set, '${id}',{ node, type: 'attribute' });`);
        }
        //no variable provided; setting attributeMap
        const addToLiveList = id
          ? `\addToSet(set, \`${id}#\${k}\`, { node, type: 'attribute', 'attrName': k });`
          : '';
        instructions.push(`{
          const tmpAttrs = getValue(data, '${attrName}');
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