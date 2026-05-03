function getOgProp($, property) {
  const content = $(`meta[property="${property}" i]`).attr("content");
  return content !== undefined && content.trim().length > 0 ? content.trim() : null;
}
export function extractOpenGraph($) {
  const localeAlternate = [];
  $('meta[property="og:locale:alternate" i]').each((_i, el) => {
    const content = $(el).attr("content");
    if (content !== undefined && content.trim().length > 0) {
      localeAlternate.push(content.trim());
    }
  });
  return {
    title: getOgProp($, "og:title"),
    description: getOgProp($, "og:description"),
    image: getOgProp($, "og:image"),
    imageWidth: getOgProp($, "og:image:width"),
    imageHeight: getOgProp($, "og:image:height"),
    imageAlt: getOgProp($, "og:image:alt"),
    url: getOgProp($, "og:url"),
    type: getOgProp($, "og:type"),
    siteName: getOgProp($, "og:site_name"),
    locale: getOgProp($, "og:locale"),
    localeAlternate,
  };
}
