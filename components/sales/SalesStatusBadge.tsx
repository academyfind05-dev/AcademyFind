"use client";

export function SalesStatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; label: string; dot: string }> = {
        NOT_CONTACTED: {
            bg: "bg-slate-100",
            text: "text-slate-600",
            label: "Not Contacted",
            dot: "bg-slate-400",
        },
        CONTACTED: {
            bg: "bg-amber-50",
            text: "text-amber-700",
            label: "Contacted",
            dot: "bg-amber-500",
        },
        IN_PROCESS: {
            bg: "bg-purple-50",
            text: "text-purple-700",
            label: "In Process",
            dot: "bg-purple-500",
        },
        ONBOARDED: {
            bg: "bg-emerald-50",
            text: "text-emerald-700",
            label: "Onboarded",
            dot: "bg-emerald-500",
        },
        UPGRADED: {
            bg: "bg-violet-100",
            text: "text-violet-800",
            label: "Upgraded 🚀",
            dot: "bg-violet-600",
        },
    };

    const c = config[status] || config.NOT_CONTACTED;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${c.bg} ${c.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
            {c.label}
        </span>
    );
}

export function InterestBadge({ interest }: { interest: string | null }) {
    if (!interest) return null;

    const isInterested = interest === "INTERESTED";
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
            isInterested
                ? "bg-blue-50 text-blue-700 border border-blue-100"
                : "bg-red-50 text-red-600 border border-red-100"
        }`}>
            {isInterested ? "✓ Interested" : "✗ Not Interested"}
        </span>
    );
}
