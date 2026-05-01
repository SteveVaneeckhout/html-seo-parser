export function extractLanguage($) {
  const lang = $("html").attr("lang");
  return lang !== undefined && lang.trim().length > 0 ? lang.trim() : null;
}
