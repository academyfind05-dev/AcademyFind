import Link from "next/link";
import { Coins, ArrowRight } from "lucide-react";
import Image from "next/image";

export function HowToEarnCoins() {
  return (
    <div className="container mx-auto px-4 max-w-6xl mt-2 mb-8">
      <Link href="/how-to-earn-coins" className="block w-full group">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-md hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
          
          <div className="relative px-6 py-8 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm border border-white/30">
                <Coins className="w-8 h-8 text-white" />
              </div>
              <div className="text-center md:text-left text-white">
                <h3 className="text-2xl md:text-3xl font-black mb-1">
                  How to Earn AF Coins
                </h3>
                <p className="text-amber-50 font-medium">
                  Unlock premium features, counseling, and contacts for free!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-full font-bold shadow-sm group-hover:bg-amber-50 transition-colors whitespace-nowrap">
              Learn More <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
