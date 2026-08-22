"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
    CheckCircle2,
    Phone,
    Sparkles,
    ArrowRight,
    Star,
    BookOpen,
    Heart,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CallBackSuccessPopUpProps {
    isOpen: boolean;
    onClose: () => void;
    isLoggedIn: boolean;
    instituteName?: string;
}

export default function CallBackSuccessPopUp({
    isOpen,
    onClose,
    isLoggedIn,
    instituteName,
}: CallBackSuccessPopUpProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-sm rounded-3xl border-0 p-0 overflow-hidden shadow-2xl">
                {/* Accessibility: sr-only title/description */}
                <DialogHeader className="sr-only">
                    <DialogTitle>Enquiry Submitted Successfully</DialogTitle>
                    <DialogDescription>
                        Your enquiry has been submitted. The institute will contact you shortly.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative bg-white">
                    {/* Top gradient banner */}
                    <div className="bg-gradient-to-br from-amber-400 to-amber-500 px-6 pt-8 pb-10 text-center text-white relative overflow-hidden">
                        {/* Decorative circles */}
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full" />

                        <div className="relative z-10">
                            {/* Animated check icon */}
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-4 ring-white/30">
                                <CheckCircle2 className="h-9 w-9 text-white" />
                            </div>
                            <h2 className="text-2xl font-extrabold tracking-tight">
                                Enquiry Submitted!
                            </h2>
                            <p className="mt-2 text-amber-50 text-sm leading-relaxed">
                                {instituteName
                                    ? `${instituteName} will contact you shortly.`
                                    : "The institute will contact you shortly."}
                            </p>
                        </div>
                    </div>

                    {/* Bottom content */}
                    <div className="px-6 py-6 space-y-4 -mt-4 bg-white rounded-t-3xl relative z-10">
                        {/* Info card */}
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                            <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                <Phone className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900">
                                    What happens next?
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                                    A counselor from the institute will call you within{" "}
                                    <span className="font-bold">24 hours</span>{" "}to discuss
                                    admission, fees &amp; batches.
                                </p>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="space-y-2">
                            {[
                                "Keep your phone reachable",
                                "Prepare your queries in advance",
                                "Check reviews from other students",
                            ].map((tip: any, i: any) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                                    <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-[9px] font-bold text-amber-600">✓</span>
                                    </div>
                                    {tip}
                                </div>
                            ))}
                        </div>

                        <Button
                            onClick={onClose}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl py-3"
                        >
                            Got it, Thanks! 🙌
                        </Button>

                        {/* Sign up / Login for Guest Users */}
                        {!isLoggedIn && (
                            <div className="mt-5 pt-5 border-t border-slate-100">
                                <p className="text-center text-sm font-medium text-slate-600 mb-3">Want to explore on your own?</p>
                                <div className="flex gap-2">
                                    <Link href="/login" onClick={onClose} className="flex-1">
                                        <Button variant="outline" className="w-full rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold">
                                            Login
                                        </Button>
                                    </Link>
                                    <Link href="/register" onClick={onClose} className="flex-1">
                                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold">
                                            Sign Up
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}