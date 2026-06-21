"use client";

import { Message, Product, CartItem } from '@/types/chat';

// Curated catalog themed for premium Sri Lankan commerce
const MOCK_CATALOG: Record<string, Product[]> = {
    tea: [
        { id: 't1', name: 'Amba Estate Artisanal Hand-Rolled Hand-Picked Tea', price: 14500, rating: 4.9, description: 'Extremely rare, micro-lot organic black tea from the high valleys of Ella.', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400', category: 'Gourmet' },
        { id: 't2', name: 'Halpe Luxury Silver Tips presentation Tube', price: 9200, rating: 4.8, description: 'Pure white tea buds dried naturally in the pristine mountain air of Uva.', image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=400', category: 'Gourmet' }
    ],
    wellness: [
        { id: 'w1', name: 'Spa Ceylon Royal Lotus Intense Hydration Set', price: 11200, rating: 4.8, description: 'Infused with precious pink lotus extracts, pure almond oils, and beach minerals.', image: 'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=400', category: 'Wellness' },
        { id: 'w2', name: 'Island Lush Organic Virgin Coconut Hair Elixir', price: 3800, rating: 4.6, description: 'Cold-pressed kernel oil infused with native vetiver and blue waterlily.', image: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=400', category: 'Wellness' }
    ],
    default: [
        { id: 'e1', name: 'WaveAudio Ceylon Pro ANC Wireless Headphones', price: 28500, rating: 4.7, description: 'Custom tuned for heavy acoustic ranges with 40h hybrid active noise cancellation.', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400', category: 'Electronics' },
        { id: 'g1', name: 'Central Highlands Single Estate Peaberry Coffee Beans', price: 4800, rating: 4.9, description: 'Medium roast arabica beans offering bright, delicate notes of citrus honey.', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=400', category: 'Gourmet' }
    ]
};

export const getSimulationReply = (userPrompt: string): { text: string; products: Product[] } => {
    const query = userPrompt.toLowerCase();
    if (query.includes('tea')) {
        return {
            text: "Excellent choice. Sri Lanka produces some of the finest single-origin teas in the world. Here are some ultra-premium selections available for fast courier delivery in Colombo:",
            products: MOCK_CATALOG.tea
        };
    }
    if (query.includes('spa') || query.includes('gift') || query.includes('mother') || query.includes('anniversary')) {
        return {
            text: "I highly recommend these luxurious authentic botanical gift formulations from our wellness partners. They come elegantly packaged with a complimentary personalized gift card:",
            products: MOCK_CATALOG.wellness
        };
    }
    return {
        text: "I've surveyed verified premium island merchants matching your request. Here are the top curated choices that offer guaranteed next-day fulfillment:",
        products: MOCK_CATALOG.default
    };
};