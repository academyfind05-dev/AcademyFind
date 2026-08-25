"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackAdAnalytics } from "@/lib/advertisement/analytics-actions";
import { usePathname } from "next/navigation";

export function AdvertisementCarousel({ ads }: { ads: any[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewedAds, setViewedAds] = useState<Set<string>>(new Set());
    const pathname = usePathname();
    const carouselRef = useRef<HTMLDivElement>(null);

    // Flatten all ads into an array of { ad, imageUrl } slides
    const [slides, setSlides] = useState<{ ad: any, imageUrl: string }[]>([]);

    useEffect(() => {
        const flatSlides = ads.flatMap(ad => 
            (ad.images || []).map((imgUrl: string) => ({ ad, imageUrl: imgUrl }))
        );
        setSlides(flatSlides);
    }, [ads]);

    // Auto rotate
    useEffect(() => {
        if (slides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 5000); // 5 seconds per ad
        return () => clearInterval(interval);
    }, [slides.length]);

    // Track views when an ad becomes visible (IntersectionObserver could be used, but since it's above the fold, we track on mount/index change)
    useEffect(() => {
        if (slides.length === 0) return;
        
        const currentSlide = slides[currentIndex];
        if (!currentSlide) return;
        
        const currentAd = currentSlide.ad;
        if (!viewedAds.has(currentAd.id)) {
            // Only track view once per component mount session to prevent spamming
            setViewedAds(prev => new Set(prev).add(currentAd.id));
            trackAdAnalytics(currentAd.id, "VIEW", pathname);
        }
    }, [currentIndex, slides, viewedAds, pathname]);

    if (slides.length === 0) return null;

    const currentSlide = slides[currentIndex];
    if (!currentSlide) return null;
    
    const currentAd = currentSlide.ad;

    const handleClick = () => {
        trackAdAnalytics(currentAd.id, "CLICK", pathname);
    };

    return (
        <div ref={carouselRef} className="w-full relative aspect-square sm:aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9] bg-white rounded-2xl overflow-hidden shadow-lg group border border-stone-100">
            <div className="absolute inset-0 bg-stone-50/50 flex items-center justify-center">
                {currentSlide.imageUrl ? (
                    <img 
                        src={currentSlide.imageUrl} 
                        alt={currentAd.title} 
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 p-2 md:p-4" 
                    />
                ) : (
                    <div className="text-slate-400">Advertisement</div>
                )}
            </div>

            {/* Clickable Overlay */}
            {currentAd.linkUrl ? (
                <a 
                    href={currentAd.linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={handleClick}
                    className="absolute inset-0 z-10 block"
                    aria-label={`Visit ${currentAd.title}`}
                />
            ) : (
                <div onClick={handleClick} className="absolute inset-0 z-10 cursor-pointer" />
            )}

            {/* Indicators */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {slides.map((_, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-2 rounded-full transition-all ${
                                idx === currentIndex ? "w-6 bg-amber-500" : "w-2 bg-white/60 hover:bg-white"
                            }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
            
            {/* Tag */}
            <div className="absolute top-4 right-4 z-20 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                Ad
            </div>
        </div>
    );
}
