"use client";

import { motion } from 'framer-motion';

export default function TypingIndicator() {
    return (
        <div className="flex items-center gap-2 px-4 py-3 bg-white border border-neutral-150/80 rounded-2xl shadow-xs max-w-[180px]">
            <span className="text-xs text-neutral-400 font-light tracking-wide animate-pulse">Kapi is thinking</span>
            <div className="flex space-x-1 items-center pt-0.5">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            repeatType: "loop",
                            delay: i * 0.15,
                            ease: "easeInOut"
                        }}
                        className="w-1 h-1 bg-[#C8A96A] rounded-full"
                    />
                ))}
            </div>
        </div>
    );
}