export declare type Attribute = {
    condition?: string;
    id?: string;
    variable?: string;
};
export declare const endSubRoutineTag = "endSubRoutine";
export declare type LoopInstruction = {
    variable: string;
    iterator: string;
    index: string;
    functionName: string;
};
export declare type Instruction = {
    type: 'text' | 'comment' | 'element' | 'ProcessingInstruction' | 'document' | 'documentFragment';
    id?: string;
    tag?: string;
    value?: string | Attribute | (string | Attribute)[] | LoopInstruction;
    children?: Instruction[];
    attributes?: {
        [key: string]: Attribute | string;
    };
};
