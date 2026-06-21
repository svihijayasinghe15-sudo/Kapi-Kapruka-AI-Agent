"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, Product } from '@/types/chat';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';

interface ChatWindowProps {
    messages: Message[];
    isTyping: boolean;
    onAddToCart: (product: Product) => void;
}

export default function ChatWindow({ messages, isTyping, onAddToCart }: ChatWindowProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages, isTyping]);

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 scrollbar-none"
        >
            <div className="max-w-2xl mx-auto w-full">
                {messages.length === 0 ? (
                    <div className="h-[50vh] flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                        <div className="w-14 h-14 bg-neutral-950 rounded-2xl flex items-center justify-center border border-neutral-800 shadow-md mb-5">
                            <span className="text-xl font-serif text-[#C8A96A] font-bold">K</span>
                        </div>
                        <h2 className="text-xl font-medium tracking-tight text-neutral-950">Curated Shopping by Kapi</h2>
                        <p className="text-xs text-neutral-400 font-light mt-1.5 leading-relaxed">
                            Say <span className="font-normal text-neutral-600">&quot;hiii&quot;</span>,{' '}
                            <span className="font-normal text-neutral-600">&quot;Ammaṭa gift ekak&quot;</span>, or{' '}
                            <span className="font-normal text-neutral-600">&quot;வணக்கம்&quot;</span> to start.
                        </p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <ChatBubble key={msg.id} message={msg} onAddToCart={onAddToCart} />
                        ))}
                    </AnimatePresence>
                )}

                {/* Typing Overlay Hook */}
                <AnimatePresence>
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="flex items-start gap-3 md:gap-4 mb-6"
                        >
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white border border-neutral-200 shadow-xs text-[10px] text-[#C8A96A] font-bold animate-pulse">
                                ✨
                            </div>
                            <TypingIndicator />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}