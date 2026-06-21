export interface Product {
    id: string;
    name: string;
    price: number;
    rating: number;
    description: string;
    image: string;
    category: string;
    url?: string;
}

export interface ShoppingContext {
    recipient?: string;
    budget?: number;
    occasion?: string;
    deliveryUrgency?: 'EXPRESS' | 'STANDARD';
    deliveryCity?: string;
    productQuery?: string;
    intent?: 'gifting' | 'shopping' | 'browsing' | 'greeting';
    languageDetected?: 'SI' | 'SINGLISH' | 'EN' | 'TA';
    hasOfferedPairing?: boolean;
    hasShownProducts?: boolean;
    askedSlots?: Array<'recipient' | 'budget' | 'occasion' | 'deliveryUrgency'>;
    stage?: 'collecting' | 'searching' | 'results';
    lastSearchQuery?: string;
}

export interface AssistantResponse {
    reply: string;
    updatedContext: ShoppingContext;
    products?: Product[];
    quickReplies?: string[]; // Clickable suggestion chips displayed to the user
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    products?: Product[];
    quickReplies?: string[];
}

export interface CartItem {
    product: Product;
    quantity: number;
}