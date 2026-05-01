export function extractFavicon($) {
  const href = $('link[rel~="icon"]').first().attr("href");
  return href !== undefined && href.trim().length > 0 ? href.trim() : null;
}
