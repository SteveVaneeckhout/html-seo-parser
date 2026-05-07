import type { StructuredData, StructuredDataItem } from "../types.js";
import { VOCAB_VERSION } from "./vocab.generated.js";
import type { ValidationResult, ValidateOptions } from "./types.js";
export type {
  ValidationIssue,
  ValidationResult,
  ValidateOptions,
  ValidationLevel,
  ValidationCode,
} from "./types.js";
export { VOCAB_VERSION };
export declare function validate(
  input: StructuredData | StructuredDataItem | StructuredDataItem[],
  options?: ValidateOptions,
): ValidationResult;
