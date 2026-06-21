"use client";

import React, { useState } from 'react';
import { Package } from 'lucide-react';

function proxyUrl(url: string): string {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function isKaprukaImage(url: string): boolean {
    return url.includes('kapruka.com');
}

interface ProductImageProps {
    src: string;
    alt: string;
    className?: string;
}

export default function ProductImage({ src, alt, className = '' }: ProductImageProps) {
    const cleanSrc = src?.trim() || '';
    const [useProxy, setUseProxy] = useState(isKaprukaImage(cleanSrc));
    const [failed, setFailed] = useState(false);

    if (!cleanSrc || failed) {
        return (
            <div className={`flex items-center justify-center bg-neutral-100 ${className}`}>
                <Package className="w-8 h-8 text-neutral-300" />
            </div>
        );
    }

    const imageSrc = useProxy ? proxyUrl(cleanSrc) : cleanSrc;

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => {
                if (useProxy) {
                    setFailed(true);
                } else {
                    setUseProxy(true);
                }
            }}
        />
    );
}
