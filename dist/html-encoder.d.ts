import { TargetType as ESTypes } from './typescript/index';
export declare type TargetType = 'json' | ESTypes;
export default function htmlEncoder(html: string, type?: TargetType, isSSR?: boolean): string;
