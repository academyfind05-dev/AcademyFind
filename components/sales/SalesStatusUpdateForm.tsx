"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SalesStatusUpdateFormProps {
    assignmentId: string;
    currentStatus: string;
    currentInterest: string | null;
    currentRemark: string | null;
    currentPlan: string | null;
}

export default function SalesStatusUpdateForm({
    assignmentId,
    currentStatus,
    currentInterest,
    currentRemark,
    currentPlan,
}: SalesStatusUpdateFormProps) {
    const router = useRouter();
    const [status, setStatus] = useState(currentStatus);
    const [interest, setInterest] = useState(currentInterest || "");
    const [remark, setRemark] = useState(currentRemark || "");
    const [plan, setPlan] = useState(currentPlan || "");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/sales/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assignmentId,
                    contactStatus: status,
                    interest: status === "CONTACTED" ? interest : undefined,
                    remark: remark || undefined,
                    onboardedPlan: status === "ONBOARDED" ? plan : undefined,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("✅ Status updated successfully!");
                router.refresh();
            } else {
                setMessage(`❌ ${data.error || "Failed to update"}`);
            }
        } catch {
            setMessage("❌ Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50/80 border border-slate-200 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                Update Contact Status
            </h4>

            {/* Status Select */}
            <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Contact Status</label>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all"
                >
                    <option value="NOT_CONTACTED">Not Contacted</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="IN_PROCESS">In Process</option>
                    <option value="ONBOARDED">Onboarded</option>
                    <option value="UPGRADED">Upgraded 🚀</option>
                </select>
            </div>

            {/* Interest - shown when CONTACTED */}
            {status === "CONTACTED" && (
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Interest Level</label>
                    <div className="flex gap-3">
                        <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                            interest === "INTERESTED"
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                        }`}>
                            <input
                                type="radio"
                                name="interest"
                                value="INTERESTED"
                                checked={interest === "INTERESTED"}
                                onChange={(e) => setInterest(e.target.value)}
                                className="sr-only"
                            />
                            👍 Interested
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                            interest === "NOT_INTERESTED"
                                ? "border-red-500 bg-red-50 text-red-700"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                        }`}>
                            <input
                                type="radio"
                                name="interest"
                                value="NOT_INTERESTED"
                                checked={interest === "NOT_INTERESTED"}
                                onChange={(e) => setInterest(e.target.value)}
                                className="sr-only"
                            />
                            👎 Not Interested
                        </label>
                    </div>
                </div>
            )}

            {/* Onboarded / Upgraded Plan - shown when ONBOARDED or UPGRADED */}
            {(status === "ONBOARDED" || status === "UPGRADED") && (
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                        {status === "UPGRADED" ? "Upgraded Plan" : "Onboarded Plan"}
                    </label>
                    <select
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all"
                    >
                        <option value="">Select a plan...</option>
                        <option value="BASIC">Basic</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="PREMIUM">Premium</option>
                        <option value="ULTRA">Ultra</option>
                    </select>
                </div>
            )}

            {/* Remark */}
            <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Remark / Notes</label>
                <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    rows={3}
                    placeholder="Add notes about the conversation..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all resize-none placeholder:text-slate-400"
                />
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                    {loading ? "Saving..." : "Save Changes"}
                </button>
                {message && (
                    <span className="text-sm font-medium">{message}</span>
                )}
            </div>
        </form>
    );
}
