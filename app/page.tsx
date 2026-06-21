"use client";

import React, { useState, useCallback } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';
import WelcomeScreen from '@/components/chat/WelcomeScreen';
import CartPanel from '@/components/cart/CartPanel';
import CartDrawer from '@/components/cart/CartDrawer';
import AddedToCartToast from '@/components/cart/AddedToCartToast';
import { Message, Product, ShoppingContext, CartItem } from '@/types/chat';
import { ArrowUp, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
    const [addedProduct, setAddedProduct] = useState<Product | null>(null);
    const [context, setContext] = useState<ShoppingContext>({});
    const [activeQuickReplies, setActiveQuickReplies] = useState<string[]>([
        'Hi!',
        'Ammaṭa gift ekak',
        'வணக்கம் — gift தேடுகிறேன்',
    ]);
    const [showWelcome, setShowWelcome] = useState(true);

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const handleSendMessage = async (textToSend?: string) => {
        const text = textToSend || input;
        if (!text.trim() || isTyping) return;

        setShowWelcome(false);
        const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: stamp };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setActiveQuickReplies([]);
        setIsTyping(true);

        try {
            const history = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, context, history }),
            });

            if (!response.ok) {
                throw new Error('Chat request failed');
            }

            const result = await response.json();
            setContext(result.updatedContext);
            setActiveQuickReplies(result.quickReplies || []);

            const assistantMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: result.reply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                products: result.products,
                quickReplies: result.quickReplies,
            };

            setMessages((prev) => [...prev, assistantMsg]);
        } catch {
            const fallback: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content:
                    context.languageDetected === 'SI' || context.languageDetected === 'SINGLISH'
                        ? 'Ow, connection issue ekak. Thawa ekak try karanna puluwan da?'
                        : context.languageDetected === 'TA'
                          ? 'Connection issue. மறுபடி try பண்ணுங்கள்!'
                          : 'Sorry, I had a connection hiccup. Mind trying that again?',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, fallback]);
            setActiveQuickReplies(['Hi!', 'Gift for Mom', 'Try again']);
        } finally {
            setIsTyping(false);
        }
    };

    const handleAddToCart = useCallback((product: Product) => {
        setCartItems((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
        setAddedProduct(product);

        // Auto-dismiss toast after 4 seconds
        setTimeout(() => setAddedProduct(null), 4000);
    }, []);

    const handleUpdateQuantity = useCallback((id: string, delta: number) => {
        setCartItems((prev) =>
            prev
                .map((item) =>
                    item.product.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
                )
                .filter((item) => item.quantity > 0)
        );
    }, []);

    const handleRemoveItem = useCallback((id: string) => {
        setCartItems((prev) => prev.filter((item) => item.product.id !== id));
    }, []);

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-900 font-sans antialiased">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-200/60 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-neutral-950 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-serif font-bold text-[#C8A96A]">K</span>
                    </div>
                    <span className="font-semibold tracking-tight text-xs md:text-sm">
                        Kapi{' '}
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-500 rounded-md font-normal ml-1">
                            CONCIERGE
                        </span>
                    </span>
                </div>
                <button
                    onClick={() => cartCount > 0 && setCartDrawerOpen(true)}
                    className={`relative p-2 rounded-xl border bg-white transition-colors lg:hidden ${
                        cartCount > 0 ? 'hover:bg-neutral-50' : 'opacity-40 cursor-default'
                    }`}
                    disabled={cartCount === 0}
                >
                    <ShoppingCart className="w-4 h-4 text-neutral-700" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-neutral-950 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                            {cartCount}
                        </span>
                    )}
                </button>
            </header>

            <div className="flex flex-1 min-h-0">
                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                    {showWelcome && messages.length === 0 ? (
                        <WelcomeScreen onQuickAction={handleSendMessage} />
                    ) : (
                        <ChatWindow messages={messages} isTyping={isTyping} onAddToCart={handleAddToCart} />
                    )}

                    <footer className="shrink-0 bg-gradient-to-t from-neutral-50 via-neutral-50/98 to-transparent pt-4 pb-6 px-4 z-10">
                        <div className="max-w-xl mx-auto flex flex-col gap-3">
                            {activeQuickReplies.length > 0 && (
                                <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none">
                                    {activeQuickReplies.map((replyText, idx) => (
                                        <motion.button
                                            key={`${replyText}-${idx}`}
                                            whileHover={{ scale: 1.02, backgroundColor: '#f5f5f5' }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleSendMessage(replyText)}
                                            disabled={isTyping}
                                            className="px-3.5 py-1.5 bg-white border border-neutral-200 text-neutral-700 rounded-full text-[12px] font-normal shadow-xs transition-colors whitespace-nowrap cursor-pointer hover:border-neutral-300 disabled:opacity-50"
                                        >
                                            {replyText}
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            <div className="relative flex items-center w-full">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type in English, Singlish, Sinhala, or Tamil…"
                                    disabled={isTyping}
                                    className="w-full pl-4 pr-12 py-3.5 rounded-xl bg-white border border-neutral-200 shadow-xs text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 placeholder:text-neutral-400 transition-all font-light disabled:opacity-60"
                                />
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!input.trim() || isTyping}
                                    className="absolute right-2 p-2 rounded-lg bg-neutral-950 text-white hover:bg-neutral-900 transition-colors disabled:opacity-30"
                                >
                                    <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                            </div>
                        </div>
                    </footer>
                </div>

                <CartPanel
                    cartItems={cartItems}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                />
            </div>

            <CartDrawer
                isOpen={cartDrawerOpen}
                onClose={() => setCartDrawerOpen(false)}
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
            />

            <AddedToCartToast
                product={addedProduct}
                cartVisible={cartCount > 0}
                onDismiss={() => setAddedProduct(null)}
                onViewCart={() => {
                    setAddedProduct(null);
                    setCartDrawerOpen(true);
                }}
            />
        </div>
    );
}
