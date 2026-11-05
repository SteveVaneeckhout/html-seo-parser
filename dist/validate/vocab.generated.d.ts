export declare const VOCAB_VERSION = "30.0";
export interface VocabType {
    subTypeOf: string[];
}
export interface VocabProperty {
    domainIncludes: string[];
    rangeIncludes: string[];
}
export declare const types: ReadonlyMap<string, VocabType>;
export declare const properties: ReadonlyMap<string, VocabProperty>;
