"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useCallback } from "react";
import { Megaphone, Coins, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
    <div className="fixed right-0 top-[35%] z-[40] hidden -translate-y-1/2 flex-col gap-4 rounded-l-xl bg-white/90 p-2 shadow-lg backdrop-blur-md border border-r-0 border-slate-200 transition-all hover:pl-4 md:flex">

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
        <DialogContent className="w-[95vw] md:w-auto md:h-[95vh] md:aspect-square !max-w-[95vw] !max-h-[95vh] flex flex-col p-0 overflow-hidden bg-white border-none rounded-3xl z-[9999]">
          <DialogHeader className="p-4 md:p-6 pb-4 shrink-0 border-b border-slate-100 z-10 bg-white relative">
            <DialogTitle className="text-xl md:text-3xl font-black text-slate-900 text-center flex items-center justify-center gap-2 flex-wrap pr-8">
              <span className="text-amber-500">AF Coins</span> <Coins className="w-6 h-6 md:w-8 md:h-8 text-amber-500" /> : Earn More. Unlock More.
            </DialogTitle>
            <DialogClose className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 bg-slate-100 hover:bg-slate-200 transition-colors z-50">
              <X className="w-5 h-5 text-slate-500" />
            </DialogClose>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-white flex flex-col items-center justify-center relative p-0 md:p-2">

            {/* Carousel Container */}
            <div className="relative w-full h-full flex-1">
              {/* Left Arrow */}
              <button
                onClick={handlePrevious}
                className="absolute left-2 md:left-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 md:h-12 md:w-12 items-center justify-center rounded-full bg-slate-100/80 backdrop-blur-md text-slate-800 shadow-xl border border-slate-200 hover:bg-amber-100 hover:text-amber-600 transition-all"
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>

              {/* Image Viewer */}
              <div className="relative w-full h-full">
                <Image
                  src={waysToEarn[currentIndex].src}
                  alt={waysToEarn[currentIndex].alt}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Right Arrow */}
              <button
                onClick={handleNext}
                className="absolute right-0 md:right-1 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 md:h-12 md:w-12 items-center justify-center rounded-full bg-slate-100/80 backdrop-blur-md text-slate-800 shadow-xl border border-slate-200 hover:bg-amber-100 hover:text-amber-600 transition-all"
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>

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
