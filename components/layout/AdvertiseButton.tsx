"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useCallback } from "react";
import { Megaphone, Coins, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AdvertiseButton() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const waysToEarn = [
    { src: "/afc/afc-2-1.png", alt: "Sign Up Bonus" },
    { src: "/afc/afc-2-2.png", alt: "Complete Profile" },
    { src: "/afc/afc-2-3.png", alt: "Write Reviews" },
    { src: "/afc/afc-2-4.png", alt: "Invite Friends" },
  ];

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? waysToEarn.length - 1 : prev - 1));
  }, [waysToEarn.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === waysToEarn.length - 1 ? 0 : prev + 1));
  }, [waysToEarn.length]);

  return (
    <div className="absolute right-0 top-1/2 z-[50] hidden -translate-y-1/2 flex-col gap-4 rounded-l-xl bg-white/90 p-2 shadow-lg backdrop-blur-md border border-r-0 border-slate-200 transition-all hover:pl-4 md:flex">
      
      <Dialog>
        <DialogTrigger asChild>
          <button
            title="Earn AF Coins"
            className="flex flex-col items-center justify-center gap-1 text-slate-500 transition-all duration-300 hover:text-amber-500 pb-3 border-b border-slate-100 bg-transparent border-none outline-none cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 transition-all duration-300 hover:bg-amber-500 hover:text-white shadow-sm">
              <Coins className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              Earn Coins
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50 border-none sm:max-w-4xl rounded-3xl z-[9999]">
          <DialogHeader className="p-4 md:p-6 pb-2 shrink-0">
            <DialogTitle className="text-2xl md:text-3xl font-black text-slate-900 text-center">
              How to Earn <span className="text-amber-500">AF Coins</span> 🪙
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-4 md:p-6 pt-0 flex flex-col items-center">
            
            {/* Carousel Container */}
            <div className="relative w-full flex-1 mt-2 min-h-0">
              {/* Left Arrow */}
              <button 
                onClick={handlePrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white text-slate-800 shadow-xl border border-slate-200 hover:bg-amber-50 hover:text-amber-600 transition-all"
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              
              {/* Image Viewer */}
              <div className="relative w-full h-full px-12 md:px-16 mx-auto max-w-5xl">
                <Image
                  src={waysToEarn[currentIndex].src}
                  alt={waysToEarn[currentIndex].alt}
                  fill
                  className="object-contain p-4 md:p-8"
                  priority
                />
              </div>

              {/* Right Arrow */}
              <button 
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white text-slate-800 shadow-xl border border-slate-200 hover:bg-amber-50 hover:text-amber-600 transition-all"
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>

            {/* Dots */}
            <div className="flex gap-2 mt-4 justify-center shrink-0">
              {waysToEarn.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === currentIndex ? "bg-amber-500 w-6" : "bg-slate-300 hover:bg-amber-300"
                  }`}
                />
              ))}
            </div>
            
            <div className="mt-6 text-center shrink-0">
              <Link
                href="/wallet"
                className="inline-flex items-center justify-center px-8 py-3 text-sm md:text-base font-bold text-slate-900 bg-amber-400 rounded-full hover:bg-amber-500 transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
              >
                Go to My Wallet →
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Link
        href="/advertise"
        title="Advertise with us"
        className="flex flex-col items-center justify-center gap-1 text-slate-500 transition-all duration-300 hover:text-orange-500"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 transition-all duration-300 hover:bg-orange-500 hover:text-white shadow-sm">
          <Megaphone className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          Advertise
        </span>
      </Link>
    </div>
  );
}
