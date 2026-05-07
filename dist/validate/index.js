import {
  types as vocabTypes,
  properties as vocabProperties,
  VOCAB_VERSION,
} from "./vocab.generated.js";
import { ancestorTypes } from "./subtypeWalk.js";
export { VOCAB_VERSION };
const SCHEMA_PREFIX_RE = /^https?:\/\/schema\.org\//i;
const SCHEMA_HOST_RE = /^https?:\/\/schema\.org\/?$/i;
export function validate(input, options = {}) {
  const issues = [];
  const buckets = normalizeInput(input);
  for (const [bucketName, items] of buckets) {
    items.forEach((item, idx) => {
      const path = bucketName === null ? [idx] : [bucketName, idx];
      validateItem(item, path, issues);
    });
  }
  if (options.strict === true) {
    for (const issue of issues) {
      if (issue.level === "warning") issue.level = "error";
    }
  }
  return {
    valid: !issues.some((i) => i.level === "error"),
    issues,
  };
}
function normalizeInput(input) {
  if (Array.isArray(input)) return [[null, input]];
  if (isStructuredData(input)) {
    return [
      ["jsonLd", input.jsonLd],
      ["microdata", input.microdata],
      ["rdfa", input.rdfa],
    ];
  }
  return [[null, [input]]];
}
function isStructuredData(value) {
  return (
    "jsonLd" in value &&
    "microdata" in value &&
    "rdfa" in value &&
    Array.isArray(value.jsonLd) &&
    Array.isArray(value.microdata) &&
    Array.isArray(value.rdfa)
  );
}
function validateItem(item, path, issues) {
  if (!isSchemaOrgItem(item)) {
    issues.push({
      level: "info",
      code: "unknown-vocabulary",
      path,
      message: "Item is not in the Schema.org vocabulary; type/property checks skipped.",
    });
    return;
  }
  const typeNames = extractTypeNames(item).map(canonicalize);
  for (const t of typeNames) {
    if (vocabTypes[t] === undefined) {
      issues.push({
        level: "warning",
        code: "unknown-type",
        path: [...path, "@type"],
        type: t,
        message: `Unknown Schema.org type: "${t}"`,
      });
    }
  }
  const ancestorsForItem = new Set();
  for (const t of typeNames) {
    for (const a of ancestorTypes(t)) ancestorsForItem.add(a);
  }
  for (const [key, rawValue] of Object.entries(item)) {
    if (key.startsWith("@") || rawValue === undefined) continue;
    const propName = canonicalize(key);
    const propDef = vocabProperties[propName];
    if (propDef === undefined) {
      issues.push({
        level: "warning",
        code: "unknown-property",
        path: [...path, key],
        property: propName,
        message: `Unknown Schema.org property: "${propName}"`,
      });
      continue;
    }
    if (typeNames.length > 0 && propDef.domainIncludes.length > 0) {
      const domainOk = propDef.domainIncludes.some((d) => ancestorsForItem.has(d));
      if (!domainOk) {
        issues.push({
          level: "warning",
          code: "property-not-in-domain",
          path: [...path, key],
          type: typeNames.join(", "),
          property: propName,
          message: `Property "${propName}" is not in the domain of "${typeNames.join(", ")}"`,
        });
      }
    }
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    values.forEach((v, vIdx) => {
      const valuePath = Array.isArray(rawValue) ? [...path, key, vIdx] : [...path, key];
      if (isItem(v)) {
        const nestedTypes = extractTypeNames(v).map(canonicalize);
        if (nestedTypes.length > 0 && propDef.rangeIncludes.length > 0) {
          const ancestorsForNested = new Set();
          for (const t of nestedTypes) for (const a of ancestorTypes(t)) ancestorsForNested.add(a);
          const rangeOk = propDef.rangeIncludes.some((r) => ancestorsForNested.has(r));
          if (!rangeOk) {
            issues.push({
              level: "warning",
              code: "range-mismatch",
              path: valuePath,
              type: nestedTypes.join(", "),
              property: propName,
              message: `Value type "${nestedTypes.join(", ")}" not in range of "${propName}" (expects ${propDef.rangeIncludes.join(" | ")})`,
            });
          }
        }
        validateItem(v, valuePath, issues);
      }
    });
  }
  const graph = item["@graph"];
  if (Array.isArray(graph)) {
    graph.forEach((entry, gIdx) => {
      if (isItem(entry)) {
        validateItem(entry, [...path, "@graph", gIdx], issues);
      }
    });
  }
}
function isSchemaOrgItem(item) {
  const ctx = item["@context"];
  if (typeof ctx === "string") return SCHEMA_HOST_RE.test(ctx);
  if (Array.isArray(ctx)) {
    for (const entry of ctx) {
      if (typeof entry === "string" && SCHEMA_HOST_RE.test(entry)) return true;
    }
    return false;
  }
  if (ctx !== undefined && ctx !== null && typeof ctx === "object") {
    const vocab = ctx["@vocab"];
    return typeof vocab === "string" && SCHEMA_HOST_RE.test(vocab);
  }
  // No @context: detect via @type
  for (const t of extractTypeNames(item)) {
    if (SCHEMA_PREFIX_RE.test(t)) return true;
    if (vocabTypes[canonicalize(t)] !== undefined) return true;
  }
  return false;
}
function extractTypeNames(item) {
  const t = item["@type"];
  if (t === undefined) return [];
  return Array.isArray(t) ? t : [t];
}
function canonicalize(name) {
  if (SCHEMA_PREFIX_RE.test(name)) return name.replace(SCHEMA_PREFIX_RE, "");
  if (name.startsWith("schema:")) return name.slice("schema:".length);
  return name;
}
function isItem(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
