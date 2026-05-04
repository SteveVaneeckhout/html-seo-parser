const HEADING_SELECTOR = "h1, h2, h3, h4, h5, h6";
export function extractHeadings($) {
    const entries = [];
    let order = 0;
    $(HEADING_SELECTOR).each((_i, el) => {
        const $el = $(el);
        const tagName = $el.prop("tagName");
        const level = parseInt(tagName.slice(1), 10);
        entries.push({
            level,
            text: $el.text().trim(),
            order: order++,
        });
    });
    return entries;
}
