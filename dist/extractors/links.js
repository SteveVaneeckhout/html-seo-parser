export function extractLinks($) {
  const entries = [];
  $("a[href]").each((_i, el) => {
    const $el = $(el);
    entries.push({
      href: $el.attr("href"),
      rel: $el.attr("rel") ?? null,
      text: $el.text().trim() || null,
      target: $el.attr("target") ?? null,
    });
  });
  return entries;
}
