"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { CartItem } from '@/types/chat';
import ProductImage from '@/components/products/ProductImage';

interface CartPanelProps {
    cartItems: CartItem[];
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemoveItem: (id: string) => void;
}

export default function CartPanel({ cartItems, onUpdateQuantity, onRemoveItem }: CartPanelProps) {
    const totalPrice = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <AnimatePresence>
            {cartItems.length > 0 && (
                <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 340, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                    className="hidden lg:flex flex-col shrink-0 border-l border-neutral-200 bg-white h-[calc(100vh-65px)] sticky top-[65px] overflow-hidden"
                >
                    <div className="w-[340px] flex flex-col h-full">
                        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-neutral-600" />
                                <h3 className="font-semibold text-sm text-neutral-900">Your Basket</h3>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded-full text-neutral-500">
                                {totalItems} {totalItems === 1 ? 'item' : 'items'}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cartItems.map((item) => (
                                <div
                                    key={item.product.id}
                                    className="flex gap-3 p-3 bg-neutral-50 border border-neutral-150 rounded-xl relative group"
                                >
                                    <ProductImage
                                        src={item.product.image}
                                        alt={item.product.name}
                                        className="w-14 h-14 rounded-lg object-cover border border-neutral-100 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <h5 className="text-[11px] font-medium text-neutral-800 line-clamp-2 leading-snug">
                                                {item.product.name}
                                            </h5>
                                            <p className="text-xs font-semibold text-neutral-900 mt-1">
                                                Rs. {item.product.price.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => onUpdateQuantity(item.product.id, -1)}
                                                className="p-1 border bg-white rounded-md hover:bg-neutral-100 transition-colors"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus className="w-2.5 h-2.5" />
                                            </button>
                                            <span className="text-xs px-1 min-w-[16px] text-center font-medium">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => onUpdateQuantity(item.product.id, 1)}
                                                className="p-1 border bg-white rounded-md hover:bg-neutral-100 transition-colors"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onRemoveItem(item.product.id)}
                                        className="absolute top-2 right-2 p-1 text-neutral-300 hover:text-red-500 transition-colors"
                                        aria-label="Remove item"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="p-5 border-t border-neutral-100 bg-neutral-50/50 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-neutral-500">Subtotal</span>
                                <span className="text-sm font-bold text-neutral-900">Rs. {totalPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-neutral-200/60">
                                <span className="text-xs font-semibold text-neutral-900">Total</span>
                                <span className="text-base font-bold text-neutral-900">Rs. {totalPrice.toLocaleString()}</span>
                            </div>
                            <button className="w-full py-3 bg-neutral-950 text-white rounded-xl text-xs font-medium hover:bg-neutral-900 shadow-md transition-colors">
                                Proceed to Checkout
                            </button>
                        </div>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
