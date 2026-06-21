"use client";

import React from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { CartItem } from '@/types/chat';

interface HeaderProps {
    cart: CartItem[];
    onOpenCart: () => void;
}

export default function Header({ cart, onOpenCart }: HeaderProps) {
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-md border-b border-neutral-150/80 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-neutral-950 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-serif font-bold text-[#C8A96A]">K</span>
                </div>
                <span className="font-semibold tracking-tight text-neutral-900 text-md flex items-center gap-1.5">
          Kapi <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded-md font-normal border border-neutral-200">AI</span>
        </span>
            </div>

            <button
                onClick={onOpenCart}
                className="relative p-2.5 rounded-xl hover:bg-neutral-50 border border-neutral-200/60 transition-all duration-200 flex items-center justify-center group"
            >
                <ShoppingBag className="w-4 h-4 text-neutral-700 group-hover:text-neutral-900" />
                {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-neutral-950 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white animate-scaleIn">
            {totalItems}
          </span>
                )}
            </button>
        </header>
    );
}