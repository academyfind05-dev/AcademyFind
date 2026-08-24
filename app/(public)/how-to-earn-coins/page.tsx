import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "How to Earn AF Coins | AcademyFind",
  description: "Learn how to earn AcademyFind coins and unlock premium features.",
};

export default function HowToEarnCoinsPage() {
  const waysToEarn = [
    { src: "/afc/afc-2-1.png", alt: "Sign Up Bonus" },
    { src: "/afc/afc-2-2.png", alt: "Complete Profile" },
    { src: "/afc/afc-2-3.png", alt: "Write Reviews" },
    { src: "/afc/afc-2-4.png", alt: "Invite Friends" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
            How to Earn <span className="text-amber-500">AF Coins</span> 🪙
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Collect AcademyFind Coins by contributing to the community and use them to unlock premium contacts, features, and guidance. Follow these simple steps below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {waysToEarn.map((item, index) => (
            <div 
              key={index} 
              className="relative w-full rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200"
            >
              {/* Keep the natural aspect ratio of the image or force it */}
              <Image
                src={item.src}
                alt={item.alt}
                width={800}
                height={1000}
                className="w-full h-auto object-cover"
              />
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link
            href="/wallet"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-slate-900 bg-amber-400 rounded-full hover:bg-amber-500 transition-colors"
          >
            Go to My Wallet →
          </Link>
        </div>
      </div>
    </main>
  );
}
