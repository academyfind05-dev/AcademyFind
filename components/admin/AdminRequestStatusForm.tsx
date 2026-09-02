"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { updateInstituteRequestStatus } from "@/app/(af-ass-manage)/af-ass-manage/instituteRequests/actions";

export default function AdminRequestStatusForm({ 
    requestId, 
    initialStatus, 
    initialNotes 
}: { 
    requestId: string, 
    initialStatus: string, 
    initialNotes: string | null 
}) {
    const [isPending, setIsPending] = useState(false);
    const [status, setStatus] = useState(initialStatus);
    const [notes, setNotes] = useState(initialNotes || "");

    const handleSave = async () => {
        setIsPending(true);
        const res = await updateInstituteRequestStatus(requestId, status, notes);
        if (res.success) {
            toast.success("Status & notes updated successfully!");
        } else {
            toast.error(res.error || "Execution error.");
        }
        setIsPending(false);
    };

    const statusOptions = [
        { label: "Pending", value: "PENDING" },
        { label: "Call Back", value: "CALL_BACK" },
        { label: "Follow Up", value: "FOLLOW_UP" },
        { label: "Approved", value: "APPROVED" },
        { label: "Rejected", value: "REJECTED" },
    ];

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                    {statusOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setStatus(opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                status === opt.value 
                                    ? "bg-stone-900 text-white border-stone-900 shadow-sm" 
                                    : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Admin Notes</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes about this request here..."
                    className="w-full min-h-[100px] p-3 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-y"
                />
            </div>
            <div className="flex justify-end pt-2">
                <Button 
                    disabled={isPending}
                    onClick={handleSave}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 font-bold text-xs gap-1.5 shadow-sm"
                >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} 
                    Save Updates
                </Button>
            </div>
        </div>
    );
}
