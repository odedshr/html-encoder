export type Attribute = {
  condition?: string;
  id?: string;
  variable?: string;
};

export const endSubRoutineTag = 'endSubRoutine';

export type LoopInstruction = {
  variable: string;
  iterator: string;
  index: string;
  functionName: string;
};

export type Instruction = {
  type: 'text' | 'comment' | 'element' | 'ProcessingInstruction' | 'document' | 'documentFragment';
  id?: string;
  tag?: string;
  value?: string | Attribute | (string | Attribute)[] | LoopInstruction;
  children?: Instruction[];
  attributes?: { [key: string]: Attribute | string };
};