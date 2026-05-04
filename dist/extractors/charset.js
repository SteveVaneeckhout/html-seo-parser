export function extractCharset($) {
    const direct = $("meta[charset]").first().attr("charset");
    if (direct !== undefined && direct.trim().length > 0) {
        return direct.trim();
    }
    const contentType = $('meta[http-equiv="content-type" i]').first().attr("content");
    if (contentType !== undefined) {
        const match = /charset=([^\s;]+)/i.exec(contentType);
        if (match !== null) {
            return match[1].trim();
        }
    }
    return null;
}
