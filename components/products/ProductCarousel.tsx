"use client";

import React from 'react';
import { Product } from '@/types/chat';
import ProductCard from './ProductCard';

interface ProductCarouselProps {
    products: Product[];
    onAddToCart: (product: Product) => void;
}

export default function ProductCarousel({ products, onAddToCart }: ProductCarouselProps) {
    return (
        <div className="w-full my-2 overflow-visible">
            {/* Native horizontal touch layout container */}
            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-0.5 max-w-full scrollbar-none scroll-smooth">
                {products.map((product, index) => (
                    <ProductCard
                        key={`${product.id}-${index}`}
                        product={product}
                        onAddToCart={onAddToCart}
                    />
                ))}
            </div>
        </div>
    );
}