import { Product } from '@/types/chat';
import { normalizeProductQuery } from '@/lib/product-search';

interface ParsedSearchItem {
    id: string;
    name: string;
    price: number;
    url?: string;
    stock?: string;
}

/** Parse Kapruka MCP markdown search results into structured items. */
export function parseSearchResults(markdown: string): ParsedSearchItem[] {
    if (!markdown || markdown.toLowerCase().includes('no products found')) {
        return [];
    }

    const items: ParsedSearchItem[] = [];
    const blocks = markdown.split(/\n\*\*\d+\./).slice(1);

    for (const block of blocks) {
        const nameMatch = block.match(/^([^*\n]+)/);
        const idMatch = block.match(/ID:\s*`([^`]+)`/i);
        const priceMatch = block.match(/LKR\s*([\d,]+(?:\.\d+)?)/i);
        const urlMatch = block.match(/\[View product\]\((https?:\/\/[^)]+)\)/i);
        const stockMatch = block.match(/·\s*([^·\n]+stock[^·\n]*)/i);

        if (!nameMatch || !idMatch || !priceMatch) continue;

        const id = idMatch[1].trim().toUpperCase();
        if (items.some((i) => i.id.toUpperCase() === id)) continue;

        items.push({
            name: nameMatch[1].trim(),
            id: idMatch[1].trim(),
            price: parseFloat(priceMatch[1].replace(/,/g, '')),
            url: urlMatch?.[1],
            stock: stockMatch?.[1]?.trim(),
        });
    }

    return items;
}

/** Clean image URL from Kapruka markdown — strip trailing markdown/punctuation. */
export function cleanImageUrl(url: string | undefined | null): string {
    if (!url?.trim()) return '';
    return url.trim().replace(/[)\]>\s]+$/, '');
}

/** Parse a single product detail response from kapruka_get_product. */
export function parseProductDetail(markdown: string): Partial<Product> | null {
    const nameMatch = markdown.match(/^##\s+(.+)/m);
    const idMatch = markdown.match(/\*\*ID\*\*:\s*`([^`]+)`/i);
    const priceMatch = markdown.match(/\*\*Price\*\*:\s*LKR\s*([\d,]+(?:\.\d+)?)/i);
    const categoryMatch = markdown.match(/\*\*Category\*\*:\s*(\w+)/i);
    const imageMatch = markdown.match(/\*\*Image\*\*:\s*(https?:\/\/[^\s\n]+)/i);
    const descMatch = markdown.match(/\n\n([^*\n][^\n]+(?:\n[^*\n#][^\n]*)*)/);

    if (!nameMatch || !idMatch || !priceMatch) return null;

    const image = cleanImageUrl(imageMatch?.[1]);

    return {
        id: idMatch[1].trim(),
        name: nameMatch[1].trim(),
        price: parseFloat(priceMatch[1].replace(/,/g, '')),
        category: categoryMatch?.[1] ?? 'Kapruka',
        image: image || 'https://www.kapruka.com/favicon.ico',
        description: descMatch?.[1]?.trim().slice(0, 120) ?? 'Available on Kapruka.com',
        rating: 4.5,
        url: markdown.match(/\[View on Kapruka\]\((https?:\/\/[^)]+)\)/i)?.[1],
    };
}

export async function enrichSearchResults(
    items: ParsedSearchItem[],
    getProduct: (id: string) => Promise<string>
): Promise<Product[]> {
    const products: Product[] = [];
    const seen = new Set<string>();

    for (const item of items.slice(0, 6)) {
        const idKey = item.id.trim().toUpperCase();
        if (seen.has(idKey)) continue;
        seen.add(idKey);

        try {
            const detail = await getProduct(item.id);
            const parsed = parseProductDetail(detail);
            products.push({
                id: item.id,
                name: parsed?.name ?? item.name,
                price: parsed?.price ?? item.price,
                rating: parsed?.rating ?? 4.5,
                description: parsed?.description ?? `In stock on Kapruka — ${item.stock ?? 'available'}`,
                image: cleanImageUrl(parsed?.image) || 'https://www.kapruka.com/favicon.ico',
                category: parsed?.category ?? 'Kapruka',
                url: parsed?.url ?? item.url,
            });
        } catch {
            products.push({
                id: item.id,
                name: item.name,
                price: item.price,
                rating: 4.5,
                description: item.stock ?? 'Available on Kapruka.com',
                image: 'https://www.kapruka.com/favicon.ico',
                category: 'Kapruka',
                url: item.url,
            });
        }
    }

    return products;
}

export function buildSearchQuery(context: {
    recipient?: string;
    occasion?: string;
    intent?: string;
    productQuery?: string;
}): string {
    if (context.productQuery) {
        const q = normalizeProductQuery(context.productQuery);
        return q === 'tea' ? 'ceylon tea' : q;
    }

    const parts: string[] = [];

    if (context.occasion) {
        if (context.occasion === 'General Gift') {
            parts.push('gift');
        } else {
            const occasionQueries: Record<string, string> = {
                Birthday: 'birthday gift',
                Anniversary: 'anniversary gift',
                Wedding: 'wedding gift',
                Avurudu: 'avurudu gift',
                "Valentine's": 'valentine gift',
                "Mother's Day": 'mothers day gift',
            };
            parts.push(occasionQueries[context.occasion] ?? `${context.occasion.toLowerCase()} gift`);
        }
    } else {
        parts.push('gift');
    }

    if (context.recipient) {
        parts.push(context.recipient.toLowerCase());
    }

    return parts.join(' ');
}
