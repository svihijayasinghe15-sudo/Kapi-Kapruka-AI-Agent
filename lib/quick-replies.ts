import { Lang } from '@/lib/language';
import { Product, ShoppingContext } from '@/types/chat';
import { normalizeProductQuery } from '@/lib/product-search';

function truncateLabel(text: string, max = 30): string {
    const cleaned = text.trim();
    if (cleaned.length <= max) return cleaned;
    return `${cleaned.slice(0, max - 1).trim()}…`;
}

function localizedAction(key: string, lang: Lang, vars?: Record<string, string>): string {
    const templates: Record<string, Record<Lang, string>> = {
        try_higher_budget: {
            EN: 'Try higher budget',
            SINGLISH: 'Budget ekak wadi karanna',
            SI: 'Budget වැඩි කරන්න',
            TA: 'Budget அதிகமா try',
        },
        search_again: {
            EN: 'Search again',
            SINGLISH: 'Thawa search karanna',
            SI: 'නැවත search කරන්න',
            TA: 'மறுபடி search',
        },
        try_budget: {
            EN: `Try Rs. ${vars?.amount ?? ''}`,
            SINGLISH: `Rs. ${vars?.amount ?? ''} try karanna`,
            SI: `රු. ${vars?.amount ?? ''} try කරන්න`,
            TA: `ரூ. ${vars?.amount ?? ''} try`,
        },
        something_else: {
            EN: 'Search something else',
            SINGLISH: 'Wena ekak search karanna',
            SI: 'වෙනත් දෙයක් සොයන්න',
            TA: 'வேற ஏதாவது search',
        },
    };
    return templates[key]?.[lang] ?? templates[key]?.EN ?? key;
}

const RELATED_TERMS: Record<string, string[]> = {
    shoes: ['sneakers', 'sandals', 'slippers'],
    shoe: ['sneakers', 'sandals'],
    watch: ['watches', 'smart watch'],
    perfume: ['fragrance', 'body spray'],
    cake: ['chocolate cake', 'cupcakes'],
    flower: ['flower bouquet', 'roses'],
    flowers: ['bouquet', 'roses'],
    tea: ['ceylon tea', 'herbal tea'],
    gift: ['gift hamper', 'chocolate gift'],
};

function relatedSearchTerms(query: string): string[] {
    const normalized = normalizeProductQuery(query).toLowerCase();
    const words = normalized.split(/\s+/);
    for (const word of words) {
        if (RELATED_TERMS[word]) return RELATED_TERMS[word];
    }
    if (RELATED_TERMS[normalized]) return RELATED_TERMS[normalized];
    return [];
}

function productNameChips(products: Product[], limit = 3): string[] {
    return products.slice(0, limit).map((p) => truncateLabel(p.name));
}

function suggestedHigherBudget(current?: number): number | undefined {
    if (!current || current <= 0) return undefined;
    const steps = [5000, 7500, 10000, 15000, 20000, 25000, 50000];
    const next = steps.find((s) => s > current);
    return next ?? Math.round(current * 1.5);
}

export function buildContextualQuickReplies(options: {
    ctx: ShoppingContext;
    products: Product[];
    lang: Lang;
    scenario: 'results' | 'no_results' | 'duplicate_search' | 'error' | 'addon_prompt';
}): string[] {
    const { ctx, products, lang, scenario } = options;
    const query = ctx.productQuery ? normalizeProductQuery(ctx.productQuery) : undefined;
    const chips: string[] = [];

    if (scenario === 'results' && products.length > 0) {
        chips.push(...productNameChips(products, 3));
        if (chips.length < 4) {
            chips.push(localizedAction('something_else', lang));
        }
        return chips.slice(0, 4);
    }

    if (scenario === 'no_results' || scenario === 'duplicate_search') {
        const higher = suggestedHigherBudget(ctx.budget);
        if (higher) chips.push(localizedAction('try_budget', lang, { amount: higher.toLocaleString() }));
        if (query) {
            chips.push(localizedAction('search_again', lang));
            for (const term of relatedSearchTerms(query)) {
                if (chips.length >= 4) break;
                chips.push(term);
            }
        } else {
            chips.push(localizedAction('try_higher_budget', lang));
        }
        return chips.slice(0, 4);
    }

    if (scenario === 'error') {
        if (query) chips.push(localizedAction('search_again', lang));
        chips.push(localizedAction('try_higher_budget', lang));
        return chips.slice(0, 3);
    }

    if (scenario === 'addon_prompt') {
        if (query) {
            for (const term of relatedSearchTerms(query)) {
                chips.push(term);
            }
        }
        if (products.length > 0) {
            chips.push(...productNameChips(products, 2));
        }
        if (chips.length === 0) {
            chips.push('Birthday cake', 'Perfume', 'Flower bouquet');
        }
        return chips.slice(0, 4);
    }

    return chips.slice(0, 4);
}

export function replyDuplicateSearch(lang: Lang, query: string, budget?: number): string {
    const b = budget ? `Rs. ${budget.toLocaleString()}` : '';
    const map: Record<Lang, string> = {
        EN: `I already searched Kapruka for "${query}"${b ? ` under ${b}` : ''}. Want to try a higher budget or refine what you're looking for?`,
        SINGLISH: `"${query}" ${b ? `${b} ta adu ` : ''}search kara — same results. Budget wadi karannada, nathnam wena type ekakda?`,
        SI: `"${query}" ${b ? `${b} ට අඩු ` : ''}search කළා — same results. Budget වැඩි කරමුද, නැත්නම් වෙනත් type එකක්ද?`,
        TA: `"${query}" ${b ? `${b} க்கு கீழ் ` : ''}search பண்ணிட்டேன் — same results. Budget அதிகமா try பண்ணலாமா?`,
    };
    return map[lang];
}
