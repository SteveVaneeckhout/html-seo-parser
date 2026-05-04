function getTwitter($, name) {
    const content = $(`meta[name="${name}" i]`).attr("content");
    return content !== undefined && content.trim().length > 0 ? content.trim() : null;
}
export function extractTwitterCard($) {
    return {
        card: getTwitter($, "twitter:card"),
        title: getTwitter($, "twitter:title"),
        description: getTwitter($, "twitter:description"),
        image: getTwitter($, "twitter:image"),
        imageAlt: getTwitter($, "twitter:image:alt"),
        site: getTwitter($, "twitter:site"),
        creator: getTwitter($, "twitter:creator"),
    };
}
