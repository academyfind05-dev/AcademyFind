"use client";

import { useState } from "react";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AFC_PRICING } from "@/lib/wallet/af-coins";

export function BuyCoins({ instituteId }: { instituteId?: string }) {
    const router = useRouter();

    const handleCheckout = (planId: string) => {
        // Navigate to the checkout flow (using UPI/QR similar to subscription)
        router.push(`/wallet/checkout/${planId}`);
    };

    return (
        <div className="space-y-6 mt-8 mb-8 animate-in fade-in duration-500">
            <div className="text-center">
                <h2 className="text-2xl font-extrabold text-stone-900 flex items-center justify-center gap-2 mb-2">
                    <CreditCard className="w-6 h-6 text-amber-500" /> Buy AF Coins
                </h2>
                <p className="text-sm text-stone-500">
                    Instantly add coins to your wallet via UPI and unlock premium services!
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 max-w-5xl mx-auto">
                {AFC_PRICING.map((pack) => (
                    <div key={pack.id} className="relative p-5 rounded-2xl border-2 border-stone-100 bg-white hover:border-amber-300 hover:shadow-md flex flex-col transition-all duration-300 text-center">
                        <div className="mb-2">
                            <span className="text-3xl font-black text-amber-500">
                                {pack.afc}
                            </span>
                            <span className="text-sm font-bold text-amber-700 ml-1">AFC</span>
                        </div>
                        <div className="mt-1 mb-4">
                            <span className="text-xl font-bold text-stone-800">
                                ₹{pack.price}
                            </span>
                        </div>
                        <Button 
                            onClick={() => handleCheckout(pack.id)} 
                            className="w-full py-2 rounded-xl font-bold text-sm bg-stone-900 text-white hover:bg-amber-600 transition-colors shadow-sm"
                        >
                            Buy Now
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
