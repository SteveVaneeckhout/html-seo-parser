export function extractJsonLd($) {
    const items = [];
    $('script[type="application/ld+json"]').each((_i, el) => {
        const raw = $(el).text();
        if (raw.trim().length === 0) {
            return;
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch (err) {
            items.push({ "@parseError": String(err) });
            return;
        }
        for (const item of toItems(parsed)) {
            items.push(item);
        }
    });
    return items;
}
function toItems(value) {
    if (Array.isArray(value)) {
        const out = [];
        for (const entry of value) {
            for (const item of toItems(entry)) {
                out.push(item);
            }
        }
        return out;
    }
    if (value !== null && typeof value === "object") {
        return [value];
    }
    return [
        {
            "@parseError": `Expected JSON-LD object, got ${value === null ? "null" : typeof value}`,
        },
    ];
}
