import { Instruction } from '../instruction';
export declare function getNode(instruction: Instruction, isSSR?: boolean): string;
export declare function appendNode(instruction: Instruction, isSSR?: boolean): string;
export declare function getDocument(instruction: Instruction, isSSR: boolean): string;
export declare function getDocumentFragment(instruction: Instruction, isSSR: boolean): string;
export declare function getComment(instruction: Instruction): string;
