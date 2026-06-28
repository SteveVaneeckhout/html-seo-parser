export declare const VOCAB_VERSION = "30.0";
export interface VocabType {
    subTypeOf: string[];
}
export interface VocabProperty {
    domainIncludes: string[];
    rangeIncludes: string[];
}
export declare const types: Record<string, VocabType>;
export declare const properties: Record<string, VocabProperty>;
