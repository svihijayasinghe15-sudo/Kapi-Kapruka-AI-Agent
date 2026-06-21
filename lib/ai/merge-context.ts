import { ParsedShoppingContext } from '@/types/ai';
import { ShoppingContext } from '@/types/chat';
import { Lang } from '@/lib/language';
import { GENERAL_GIFT_OCCASION } from '@/lib/occasion';

const LANGUAGE_MAP: Record<string, Lang> = {
    en: 'EN',
    english: 'EN',
    si: 'SI',
    sinhala: 'SI',
    singlish: 'SINGLISH',
    ta: 'TA',
    tamil: 'TA',
};

export function normalizeLanguage(raw: string | null | undefined): Lang | undefined {
    if (!raw) return undefined;
    return LANGUAGE_MAP[raw.toLowerCase().trim()] ?? undefined;
}

/** Merge parsed fields into conversation state — only overwrite when a new non-null value arrives. */
export function mergeParsedIntoContext(
    current: ShoppingContext,
    parsed: Partial<ParsedShoppingContext>
): ShoppingContext {
    const productQuery =
        parsed.productQuery !== undefined && parsed.productQuery !== null
            ? parsed.productQuery
            : current.productQuery;
    const productQueryChanged =
        parsed.productQuery != null && parsed.productQuery !== current.productQuery;
    const budgetChanged =
        parsed.budget != null && parsed.budget > 0 && parsed.budget !== current.budget;

    const lang = normalizeLanguage(parsed.language) ?? current.languageDetected;

    let intent = current.intent;
    if (parsed.intent) {
        const i = parsed.intent.toLowerCase();
        if (i.includes('gift') || i.includes('shop')) intent = 'gifting';
        else if (i.includes('brows')) intent = 'browsing';
        else if (i.includes('greet')) intent = 'greeting';
        else intent = 'shopping';
    }
    if (productQueryChanged) intent = 'browsing';

    return {
        recipient:
            parsed.recipient != null && parsed.recipient.trim() !== ''
                ? parsed.recipient.trim()
                : current.recipient,
        budget: parsed.budget != null && parsed.budget > 0 ? parsed.budget : current.budget,
        occasion:
            parsed.occasion != null && parsed.occasion.trim() !== ''
                ? parsed.occasion.trim()
                : current.occasion,
        deliveryUrgency: parsed.deliveryUrgency ?? current.deliveryUrgency,
        deliveryCity:
            parsed.deliveryCity != null && parsed.deliveryCity.trim() !== ''
                ? parsed.deliveryCity.trim()
                : current.deliveryCity,
        productQuery: productQuery ?? undefined,
        intent,
        languageDetected: lang,
        askedSlots: current.askedSlots,
        hasShownProducts: current.hasShownProducts,
        hasOfferedPairing: productQueryChanged ? true : current.hasOfferedPairing,
        stage: productQueryChanged ? 'searching' : current.stage,
        lastSearchQuery: productQueryChanged || budgetChanged ? undefined : current.lastSearchQuery,
    };
}

export function parsedToPartialContext(parsed: ParsedShoppingContext): Partial<ShoppingContext> {
    return mergeParsedIntoContext({}, {
        ...parsed,
        occasion:
            parsed.occasion?.toLowerCase() === 'general gift' ||
            parsed.occasion?.toLowerCase() === 'none'
                ? GENERAL_GIFT_OCCASION
                : parsed.occasion,
    });
}

export function hasRecipient(ctx: ShoppingContext): boolean {
    return Boolean(ctx.recipient?.trim());
}
