import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import AdvertisementForm from "@/components/advertisement/AdvertisementForm";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAdSettings } from "@/lib/advertisement/admin-settings-actions";

export const metadata = {
    title: "Advertise with Us | AcademyFind",
    description: "Promote your institute on AcademyFind to reach thousands of students.",
};

export default async function AdvertisePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    let dbUser = null;
    if (session?.user) {
        dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true
            }
        });
    }

    const settings = await getAdSettings();

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
                <div className="grid gap-12 lg:grid-cols-12 lg:gap-8 items-start">

                    {/* Left Column: Copy & Value Proposition */}
                    <div className="lg:col-span-5 flex flex-col justify-center space-y-8 lg:sticky lg:top-32">
                        <div>
                            <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-600 mb-6">
                                Premium Visibility
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.1]">
                                Amplify Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Institute's</span> Reach.
                            </h1>
                            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                                Get featured on AcademyFind's homepage.
                                Reach thousands of students actively looking for the best institutes in your city.
                            </p>

                            <ul className="mt-8 space-y-4 text-slate-600 font-medium">
                                <li className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 shrink-0">
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                                    </div>
                                    <span>Upload up to <strong>{settings.maxImages} high-quality images</strong></span>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-amber-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">High-Intent Traffic</h3>
                                    <p className="mt-1 text-sm text-slate-400">Get seen by students actively comparing institutes and ready to enroll.</p>
                                </div>
                            </div>

                            {/* <div className="flex items-start gap-4">
                                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-amber-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Unbeatable Value</h3>
                                    <p className="mt-1 text-sm text-slate-400">Just ₹199 for 30 days of exclusive homepage placement. No hidden fees.</p>
                                </div>
                            </div> */}

                            <div className="flex items-start gap-4">
                                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-amber-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Real-Time Analytics</h3>
                                    <p className="mt-1 text-sm text-slate-400">Track exactly how many views and clicks your advertisement generates from your dashboard.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: The Form */}
                    <div className="lg:col-span-7">
                        <div className="rounded-[2.5rem] border border-white bg-white/70 backdrop-blur-xl p-6 shadow-[0_8px_40px_rgb(0,0,0,0.04)] sm:p-10 relative overflow-hidden">
                            {/* Decorative background glow */}
                            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none"></div>
                            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none"></div>

                            <div className="relative z-10">
                                {session?.user && dbUser ? (
                                    <AdvertisementForm
                                        user={dbUser}
                                        settings={settings}
                                        bankDetails={{
                                            upiId: process.env.PAYMENT_UPI_ID || "9045639340@mbk",
                                            bankName: process.env.PAYMENT_BANK_NAME || "Punjab National Bank",
                                            accountName: process.env.PAYMENT_ACCOUNT_NAME || "JNGEE International Private Limited",
                                            accountNumber: process.env.PAYMENT_ACCOUNT_NUMBER || "4876002100004743",
                                            ifscCode: process.env.PAYMENT_IFSC_CODE || "PUNB0487600"
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-500">
                                            <Megaphone className="h-8 w-8" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800">Ready to grow your institute?</h2>
                                        <p className="mt-3 text-sm text-slate-500 mb-8 max-w-sm">Sign in or create an account to start configuring your advertisement and reach thousands of students today.</p>
                                        <Link href="/login?callbackUrl=/advertise" className="w-full rounded-xl bg-amber-500 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20">
                                            Login or Sign Up to Continue
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
