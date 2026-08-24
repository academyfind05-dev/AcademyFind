"use client";

import { useState } from "react";
import { Lock, Phone, Globe, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface UnlockContactButtonProps {
  type: "phone" | "website" | "email";
  hiddenValue: string;
  realValue: string;
  isLoggedIn: boolean;
  instituteId: string;
}

export function UnlockContactButton({ type, hiddenValue, realValue, isLoggedIn, instituteId }: UnlockContactButtonProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUnlock = async () => {
    if (!isLoggedIn) {
      toast.error("Please login to unlock contact details.");
      router.push("/login");
      return;
    }

    if (isUnlocked) return;

    if (!confirm("This will cost 1 AF Coin. Do you want to proceed?")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/wallet/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 1,
          source: "SEE_CONTACT_BASIC_INSTITUTE",
          description: `Viewed ${type} for institute ${instituteId}`,
          instituteId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsUnlocked(true);
        toast.success(`1 AFC deducted. ${type} unlocked!`);
      } else {
        toast.error(data.error || "Failed to unlock. Not enough AFC?");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const Icon = type === "phone" ? Phone : type === "website" ? Globe : Mail;

  if (isUnlocked) {
    if (type === "website") {
      return (
        <a href={realValue} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700">
          <Icon className="h-4 w-4" /> {realValue}
        </a>
      );
    }
    if (type === "phone") {
      return (
        <a href={`tel:${realValue}`} className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700">
          <Icon className="h-4 w-4" /> {realValue}
        </a>
      );
    }
    return (
      <a href={`mailto:${realValue}`} className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700">
        <Icon className="h-4 w-4" /> {realValue}
      </a>
    );
  }

  return (
    <button
      onClick={handleUnlock}
      disabled={isLoading}
      className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-amber-600 transition group focus:outline-none"
      title={`Unlock ${type} for 1 AFC`}
    >
      <Icon className="h-4 w-4 text-slate-300 group-hover:text-amber-500" />
      <span className="blur-[3px] bg-slate-200/50 rounded px-1 group-hover:blur-sm transition-all">{hiddenValue}</span>
      <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ml-1">
        {isLoading ? "Unlocking..." : "Show (1 AFC)"}
        {!isLoading && <Lock className="h-3 w-3" />}
      </span>
    </button>
  );
}
