"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogHeader,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";

import { CheckCircle2 } from "lucide-react";

const plans = [
    {
        id: "VERIFIED",
        name: "Verified",
        pricing: {
            monthly: { original: 499, offer: 199 },
            annual: { original: 4999, offer: 1999 }
        },
        desc: "Build trust and start capturing student leads.",
        features: [
            "Edit Public Profile",
            "Student Reviews",
            "Verified Badge",
            "Direct Student Leads and Inquiries"
        ]
    },
    {
        id: "PREMIUM",
        name: "Premium",
        pricing: {
            monthly: { original: 999, offer: 499 },
            annual: { original: 9999, offer: 4999 }
        },
        desc: "Showcase faculty, results, and track analytics.",
        features: [
            "Everything in Verified",
            "Rich Media (photos/videos)(upto 4)",
            "Student Community",
            "Institute Forum",
            "Institute Chat Groups",
            "Blog Publishing",
            "Reply to Reviews",
            "Verified Student and Teacher Profiles Display",
            "See Who saved your profile",
            "View Analytics of your public Profile(views + logged in user)",
        ]
    },
    {
        id: "ULTRA",
        name: "Elite",
        pricing: {
            monthly: { original: 2999, offer: 999 },
            annual: { original: 29999, offer: 9999 }
        },
        desc: "Maximum visibility and top search rankings.",
        features: [
            "Everything in Premium",
            "Top Priority Search Ranking",
            "Area-Specific Visibility",
            "Category-Specific Visibility"
        ]
    },
];

export function PricingModal({ children }: { children: React.ReactNode }) {
    const [isAnnual, setIsAnnual] = useState(false);

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>

            <DialogContent className="rounded-[2rem] border-0 p-6 md:p-10 bg-white max-h-[90vh] overflow-y-auto overflow-x-hidden w-[95vw] max-w-5xl!
      data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-4
  data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-4
  data-[state=closed]:duration-300 data-[state=open]:duration-300">

                <DialogHeader className="sr-only">
                    <DialogTitle>Pricing Plans</DialogTitle>
                    <DialogDescription>
                        Upgrade your institute profile to get more leads.
                    </DialogDescription>
                </DialogHeader>

                {/* Header & Toggle */}
                <div className="flex flex-col items-center mt-2 mb-10">
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Choose Your Plan</h2>

                    {/* 🚀 PROMO BANNER */}
                    <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 px-6 py-2.5 rounded-full text-sm font-bold shadow-sm inline-block text-center max-w-full">
                        🎉 <span className="text-amber-900">Early Bird Offer:</span> Special pricing valid only till <span className="bg-amber-200/50 px-2 py-0.5 rounded-md whitespace-nowrap mx-1">30th September</span>!
                    </div>

                    {/* Amber Toggle */}
                    <div className="bg-slate-100 p-1.5 rounded-full inline-flex relative shadow-inner border border-slate-200">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`relative w-32 py-2 text-sm font-bold rounded-full transition-colors z-10 ${!isAnnual ? 'text-amber-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`relative w-32 py-2 text-sm font-bold rounded-full transition-colors z-10 ${isAnnual ? 'text-amber-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Annually
                        </button>
                        {/* Amber Animated Pill */}
                        <div
                            className={`absolute top-1.5 bottom-1.5 w-32 bg-amber-400 rounded-full shadow-sm transition-transform duration-300 ease-out ${isAnnual ? 'translate-x-full' : 'translate-x-0'}`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    {plans.map((plan: any) => {
                        const priceData = isAnnual ? plan.pricing.annual : plan.pricing.monthly;
                        const isPremium = plan.id === "PREMIUM";

                        return (
                            <div
                                key={plan.id}
                                // 🚀 FIX: p-8 se p-5 kar diya, aur rounded-3xl se 2xl
                                className={`relative p-5 rounded-2xl border-2 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isPremium ? 'border-amber-400 bg-amber-50/30' : 'border-slate-100 bg-white hover:border-amber-200'
                                    }`}
                            >
                                {isPremium && (
                                    // 🚀 FIX: Badge ko thoda chota kiya
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Most Popular
                                    </div>
                                )}

                                <h3 className="text-lg font-extrabold text-slate-800">{plan.name}</h3>

                                {/* 🚀 FIX: Margins kam kiye (mt-4 -> mt-2) */}
                                <div className="mt-2 mb-1 flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-amber-400">
                                        ₹{priceData.offer.toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                        /{isAnnual ? 'yr' : 'mo'}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-xs text-slate-400 line-through font-semibold">
                                        ₹{priceData.original.toLocaleString('en-IN')}
                                    </span>
                                </div>

                                {/* 🚀 FIX: Height aur margin kam kiya */}
                                <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed font-medium">
                                    {plan.desc}
                                </p>

                                {/* 🚀 FIX: space-y-4 ko space-y-2.5 kiya */}
                                <ul className="space-y-2.5 mb-5 flex-1">
                                    {plan.features.map((feature: any, i: any) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                                            <span className="leading-tight">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* <DialogClose asChild className="transition">
                        <button className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                            isPremium 
                            ? 'bg-amber-500 text-white hover:bg-amber-600' 
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}>
                            Get Started
                        </button>
                        </DialogClose> */}
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}