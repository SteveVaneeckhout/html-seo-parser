export function extractTitle($) {
  const text = $("title").first().text().trim();
  return text.length > 0 ? text : null;
}
