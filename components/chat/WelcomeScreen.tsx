"use client";

import React from 'react';
import { Sparkles, Gift, Heart, Coffee } from 'lucide-react';

interface WelcomeScreenProps {
    onQuickAction: (actionText: string) => void;
}

const OFFERS = [
    {
        text: 'hiii',
        label: 'Say hi to Kapi',
        sub: 'English',
        icon: Sparkles,
    },
    {
        text: 'Ammaṭa birthday gift ekak, budget 5000',
        label: 'Ammaṭa gift ekak',
        sub: 'Singlish / Sinhala',
        icon: Gift,
    },
    {
        text: 'வணக்கம் — அம்மாவுக்கு பிறந்தநாள் gift',
        label: 'அம்மாவுக்கு birthday gift',
        sub: 'Tamil',
        icon: Heart,
    },
    {
        text: 'Show me Ceylon tea gifts under Rs. 3000',
        label: 'Ceylon tea under Rs. 3000',
        sub: 'English',
        icon: Coffee,
    },
];

export default function WelcomeScreen({ onQuickAction }: WelcomeScreenProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[55vh] text-center max-w-xl mx-auto px-4 mt-8">
            <div className="w-16 h-16 bg-neutral-950 rounded-2xl flex items-center justify-center border border-neutral-800 shadow-md mb-6">
                <span className="text-2xl font-serif text-[#C8A96A] font-bold">K</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                Discover with{' '}
                <span className="bg-gradient-to-r from-[#C8A96A] to-neutral-800 bg-clip-text text-transparent">Kapi</span>
            </h1>
            <p className="text-xs text-neutral-400 font-light max-w-sm mt-1.5 leading-relaxed">
                Chat in English, Singlish, සිංහල, or தமிழ் — real products from Kapruka, picked just for you.
            </p>

            <div className="grid grid-cols-1 gap-2.5 w-full mt-8">
                {OFFERS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={idx}
                            onClick={() => onQuickAction(item.text)}
                            className="flex items-center gap-3 p-3 text-left bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50/80 transition-colors group"
                        >
                            <div className="p-2 bg-neutral-50 rounded-lg group-hover:bg-white transition-colors border border-neutral-100">
                                <Icon className="w-4 h-4 text-neutral-500 group-hover:text-[#C8A96A]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-neutral-700">{item.label}</span>
                                <span className="text-[10px] text-neutral-400">{item.sub}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
