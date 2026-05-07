export type ValidationLevel = "error" | "warning" | "info";
export type ValidationCode =
  | "unknown-vocabulary"
  | "unknown-type"
  | "unknown-property"
  | "property-not-in-domain"
  | "range-mismatch";
export interface ValidationIssue {
  level: ValidationLevel;
  code: ValidationCode;
  path: (string | number)[];
  type?: string;
  property?: string;
  message: string;
}
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
export interface ValidateOptions {
  strict?: boolean;
}
