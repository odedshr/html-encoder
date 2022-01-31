import { Instruction, Attribute, LoopInstruction } from '../instruction';

type Features = {
  data: boolean,
  revivable: boolean,
  [key: string]: boolean
};

export function analyze(instruction: Instruction): Features {
  const stack: Instruction[] = [instruction];
  const features: Features = { data: false, revivable: false };
  let item: Instruction | undefined;

  while ((item = stack.pop()) !== undefined) {
    if (item.type === 'ProcessingInstruction') {
      features.data = true;
      if (item.tag) {
        features[item.tag] = true;
      }
      if (item.tag === 'attr' && item.attributes && hasDynamicAttributes(item.attributes)) {
        features[`dynamic-attr`] = true;
      } else if (item.tag === 'css' && item.value && hasDynamicCssValue(item.value)) {
        features[`dynamic-css`] = true;
      } else if (item.id) {
        features[`dynamic-${item.tag}`] = true;
      }
    } else if (item.id) {
      features[`dynamic-tag`] = true;
    }

    if (item.children) {
      stack.push(...item.children);
    }
  }

  features.revivable = !!Object.keys(features).find(k => k.indexOf('dynamic') >= 0);

  return features;
}

function hasDynamicAttributes(attrs: { [key: string]: Attribute | string }): boolean {
  return !!Object.keys(attrs).find(k => (<Attribute>attrs[k]).id);
}

function hasDynamicCssValue(value: string | Attribute | (string | Attribute)[] | LoopInstruction): boolean {
  const arr = Array.isArray(value) ? value : [value];
  return !!arr.find(item => !!(<Attribute>item).id);
}