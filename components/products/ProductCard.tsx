"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Star, ShoppingBag } from 'lucide-react';
import { Product } from '@/types/chat';
import ProductImage from './ProductImage';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
    return (
        <motion.div
            whileHover={{ y: -4, boxShadow: "0 14px 24px -10px rgba(0,0,0,0.06)" }}
            className="flex-shrink-0 w-[230px] bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs flex flex-col justify-between group"
        >
            <div className="relative h-36 w-full bg-neutral-50 overflow-hidden border-b border-neutral-100">
                <ProductImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-semibold text-neutral-800 shadow-xs flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    {product.rating}
                </div>
            </div>

            <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                    <span className="text-[9px] tracking-wider uppercase font-bold text-[#C8A96A]">{product.category}</span>
                    <h4 className="text-xs font-medium text-neutral-800 line-clamp-1 mt-0.5">{product.name}</h4>
                    <p className="text-[11px] text-neutral-400 font-light line-clamp-2 mt-1 leading-relaxed">{product.description}</p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900">Rs. {product.price.toLocaleString()}</span>
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onAddToCart(product)}
                        className="p-1.5 px-3 rounded-lg bg-neutral-950 text-white text-[11px] hover:bg-neutral-900 transition-colors flex items-center gap-1 font-medium shadow-sm"
                    >
                        <ShoppingBag className="w-3 h-3" /> Add
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
