export declare type TargetType = 'json' | 'js' | 'es' | 'ts';
export default function htmlEncoder(html: string, type?: TargetType, isSSR?: boolean): string;
