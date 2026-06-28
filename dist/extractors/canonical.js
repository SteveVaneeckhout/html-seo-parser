export function extractCanonical($) {
    const href = $('link[rel="canonical"]').first().attr("href");
    return href !== undefined && href.trim().length > 0 ? href.trim() : null;
}
