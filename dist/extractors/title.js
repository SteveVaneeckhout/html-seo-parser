export function extractTitle($) {
  const text = $("head > title").first().text().trim();
  return text.length > 0 ? text : null;
}
