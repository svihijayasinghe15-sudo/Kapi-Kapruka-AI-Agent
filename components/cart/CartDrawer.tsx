"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { CartItem } from '@/types/chat';
import ProductImage from '@/components/products/ProductImage';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: CartItem[];
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemoveItem: (id: string) => void;
}

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem }: CartDrawerProps) {
    const totalPrice = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-50 backdrop-blur-xs"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 26, stiffness: 220 }}
                        className="fixed top-0 right-0 h-full w-full sm:w-[380px] bg-white z-50 shadow-xl border-l border-neutral-200 flex flex-col justify-between"
                    >
                        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                            <h3 className="font-semibold text-neutral-900">Your Basket</h3>
                            <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg"><X className="w-4 h-4 text-neutral-500" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {cartItems.length === 0 ? (
                                <div className="h-40 flex items-center justify-center text-xs text-neutral-400 font-light">Your shopping basket is empty.</div>
                            ) : (
                                cartItems.map((item) => (
                                    <div key={item.product.id} className="flex gap-3 p-2.5 bg-neutral-50 border border-neutral-150 rounded-xl relative">
                                        <ProductImage
                                            src={item.product.image}
                                            alt={item.product.name}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h5 className="text-xs font-medium text-neutral-800 line-clamp-1">{item.product.name}</h5>
                                                <p className="text-xs font-semibold text-neutral-900 mt-0.5">Rs. {item.product.price.toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <button onClick={() => onUpdateQuantity(item.product.id, -1)} className="p-1 border bg-white rounded-md"><Minus className="w-2.5 h-2.5" /></button>
                                                <span className="text-xs px-1 min-w-[15px] text-center font-medium">{item.quantity}</span>
                                                <button onClick={() => onUpdateQuantity(item.product.id, 1)} className="p-1 border bg-white rounded-md"><Plus className="w-2.5 h-2.5" /></button>
                                            </div>
                                        </div>
                                        <button onClick={() => onRemoveItem(item.product.id)} className="absolute top-2 right-2 text-neutral-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))
                            )}
                        </div>

                        {cartItems.length > 0 && (
                            <div className="p-5 border-t bg-neutral-50/50 space-y-4">
                                <div className="flex justify-between text-xs font-semibold text-neutral-900">
                                    <span>Total Due</span>
                                    <span>Rs. {totalPrice.toLocaleString()}</span>
                                </div>
                                <button className="w-full py-3 bg-neutral-950 text-white rounded-xl text-xs font-medium hover:bg-neutral-900 shadow-md">
                                    Proceed to Checkout
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}