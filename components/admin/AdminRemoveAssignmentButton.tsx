"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface RemoveAssignmentButtonProps {
    assignmentId: string;
    type: "institute" | "category" | "area";
    label: string;
}

export default function RemoveAssignmentButton({ assignmentId, type, label }: RemoveAssignmentButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const handleRemove = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/sales/remove-assignment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assignmentId, type }),
            });

            if (res.ok) {
                router.refresh();
            }
        } catch {
            // silent fail
        } finally {
            setLoading(false);
            setConfirming(false);
        }
    };

    if (confirming) {
        return (
            <div className="inline-flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">Remove {label}?</span>
                <button
                    onClick={handleRemove}
                    disabled={loading}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
                >
                    No
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title={`Remove ${label}`}
        >
            <Trash2 className="w-3.5 h-3.5" />
        </button>
    );
}
