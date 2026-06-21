"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, Product } from '@/types/chat';
import ProductCarousel from '@/components/products/ProductCarousel';

interface ChatBubbleProps {
    message: Message;
    onAddToCart: (product: Product) => void;
}

export default function ChatBubble({ message, onAddToCart }: ChatBubbleProps) {
    const isUser = message.role === 'user';
    const hasProducts = !isUser && message.products && message.products.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
            className={`flex w-full gap-3 md:gap-4 mb-6 ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border text-[11px] font-semibold transition-all duration-300 shadow-xs ${
                isUser ? "bg-neutral-950 text-white border-neutral-800" : "bg-white text-neutral-800 border-neutral-200"
            }`}>
                {isUser ? "U" : "K"}
            </div>

            <div className={`flex flex-col min-w-0 ${hasProducts ? "flex-1 max-w-full" : `max-w-[85%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}`}>
                <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-xs border ${
                    isUser
                        ? "bg-neutral-950 text-white border-neutral-900 rounded-tr-none font-normal"
                        : "bg-white text-neutral-800 border-neutral-150/70 rounded-tl-none font-light bg-gradient-to-b from-white to-neutral-50/30"
                } ${hasProducts ? "max-w-xl" : ""}`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {hasProducts && (
                    <div className="w-full mt-2 -mx-1">
                        <ProductCarousel products={message.products!} onAddToCart={onAddToCart} />
                    </div>
                )}

                <span className="text-[10px] text-neutral-400 mt-1.5 px-1 font-mono tracking-tight opacity-70">
                    {message.timestamp}
                </span>
            </div>
        </motion.div>
    );
}
