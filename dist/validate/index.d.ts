import type { StructuredData, StructuredDataItem } from "../types.js";
import { VOCAB_VERSION } from "./vocab.generated.js";
import type { ValidationResult, ValidateOptions } from "./types.js";
export type { ValidationIssue, ValidationResult, ValidateOptions, ValidationLevel, ValidationCode, } from "./types.js";
export { VOCAB_VERSION };
/**
 * How deep nested items are validated. Real structured data stays far below this; the cap keeps
 * validateItem's recursion from overflowing the call stack on hostile input.
 */
export declare const MAX_VALIDATION_DEPTH = 256;
export declare function validate(input: StructuredData | StructuredDataItem | StructuredDataItem[], options?: ValidateOptions): ValidationResult;
