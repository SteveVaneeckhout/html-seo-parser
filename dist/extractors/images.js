export function extractImages($) {
    const entries = [];
    $("img").each((_i, el) => {
        const $el = $(el);
        entries.push({
            src: $el.attr("src") ?? null,
            alt: $el.attr("alt") ?? null,
            title: $el.attr("title") ?? null,
            width: $el.attr("width") ?? null,
            height: $el.attr("height") ?? null,
            loading: $el.attr("loading") ?? null,
        });
    });
    return entries;
}
