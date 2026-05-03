export function extractMicrodata($) {
  const items = [];
  $("[itemscope]:not([itemscope] [itemscope])").each((_i, el) => {
    items.push(buildItem($, el, new Set()));
  });
  return items;
}
function buildItem($, scopeEl, memory) {
  if (memory.has(scopeEl)) {
    return { "@parseError": "circular itemscope reference" };
  }
  memory.add(scopeEl);
  const item = {};
  const props = {};
  const $el = $(scopeEl);
  const itemtype = $el.attr("itemtype");
  if (itemtype !== undefined) {
    const types = splitTokens(itemtype);
    if (types.length === 1) {
      item["@type"] = types[0];
    } else if (types.length > 1) {
      item["@type"] = types;
    }
  }
  const itemid = $el.attr("itemid");
  if (itemid !== undefined && itemid.trim().length > 0) {
    item["@id"] = itemid.trim();
  }
  const pending = [];
  for (const child of scopeEl.children) {
    if (isElement(child)) pending.push(child);
  }
  const itemref = $el.attr("itemref");
  if (itemref !== undefined) {
    for (const id of splitTokens(itemref)) {
      const refEl = findById($, id);
      if (refEl !== null) pending.push(refEl);
    }
  }
  const localVisited = new Set();
  while (pending.length > 0) {
    const el = pending.shift();
    if (localVisited.has(el)) continue;
    localVisited.add(el);
    const itemprop = $(el).attr("itemprop");
    const hasItemscope = $(el).attr("itemscope") !== undefined;
    if (itemprop !== undefined) {
      const value = hasItemscope ? buildItem($, el, memory) : extractValue($, el);
      for (const name of splitTokens(itemprop)) {
        (props[name] ??= []).push(value);
      }
    }
    if (hasItemscope) continue;
    for (const child of el.children) {
      if (isElement(child)) pending.push(child);
    }
  }
  for (const [name, values] of Object.entries(props)) {
    item[name] = values.length === 1 ? values[0] : values;
  }
  memory.delete(scopeEl);
  return item;
}
function extractValue($, el) {
  const $el = $(el);
  const tag = el.tagName.toLowerCase();
  switch (tag) {
    case "meta":
      return $el.attr("content") ?? "";
    case "audio":
    case "embed":
    case "iframe":
    case "img":
    case "source":
    case "track":
    case "video":
      return $el.attr("src") ?? "";
    case "a":
    case "area":
    case "link":
      return $el.attr("href") ?? "";
    case "object":
      return $el.attr("data") ?? "";
    case "data":
    case "meter":
      return $el.attr("value") ?? "";
    case "time":
      return $el.attr("datetime") ?? $el.text().trim();
    default:
      return $el.text().trim();
  }
}
function findById($, id) {
  let found = null;
  $("[id]").each((_i, el) => {
    if (found !== null) return;
    if ($(el).attr("id") === id) found = el;
  });
  return found;
}
function splitTokens(value) {
  return value
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}
function isElement(node) {
  return typeof node === "object" && node !== null && "type" in node && node.type === "tag";
}
