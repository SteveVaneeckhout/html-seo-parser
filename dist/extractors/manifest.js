export function extractManifest($) {
    const urls = [];
    $('link[rel="manifest"]').each((_i, el) => {
        const href = $(el).attr("href");
        if (href === undefined)
            return;
        const trimmed = href.trim();
        if (trimmed.length > 0)
            urls.push(trimmed);
    });
    return urls;
}
