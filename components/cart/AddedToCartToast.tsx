"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Product } from '@/types/chat';
import ProductImage from '@/components/products/ProductImage';

interface AddedToCartToastProps {
    product: Product | null;
    cartVisible?: boolean;
    onDismiss: () => void;
    onViewCart: () => void;
}

export default function AddedToCartToast({ product, cartVisible, onDismiss, onViewCart }: AddedToCartToastProps) {
    return (
        <AnimatePresence>
            {product && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                    className={`fixed bottom-24 right-4 z-50 w-[280px] bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden ${
                        cartVisible ? 'lg:right-[360px]' : 'lg:right-8'
                    }`}
                >
                    <div className="flex items-center gap-2 px-3 py-2 bg-neutral-950 text-white">
                        <Check className="w-3.5 h-3.5 text-[#C8A96A]" />
                        <span className="text-[11px] font-medium flex-1">Added to basket</span>
                        <button onClick={onDismiss} className="p-0.5 hover:bg-white/10 rounded">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="flex gap-3 p-3">
                        <ProductImage
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 rounded-lg object-cover border border-neutral-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-neutral-800 line-clamp-2 leading-snug">
                                {product.name}
                            </p>
                            <p className="text-xs font-bold text-neutral-900 mt-1">
                                Rs. {product.price.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 px-3 pb-3">
                        <button
                            onClick={onDismiss}
                            className="flex-1 py-2 text-[11px] font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                            Keep shopping
                        </button>
                        <button
                            onClick={onViewCart}
                            className="flex-1 py-2 text-[11px] font-medium bg-neutral-950 text-white rounded-lg hover:bg-neutral-900 transition-colors"
                        >
                            View basket
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
