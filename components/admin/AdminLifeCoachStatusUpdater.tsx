"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Save } from "lucide-react";
import { updateLifeCoachStatus } from "@/lib/User/admin/adminLifeCoachStatus";

interface StatusUpdaterProps {
  requestId: string;
  currentStatus: "PENDING" | "CONTACTED" | "MESSAGED" | "CALLED" | "RESOLVED" | "JUNK" | "DNP";
  currentNotes?: string | null;
}

export default function StatusUpdater({ requestId, currentStatus, currentNotes }: StatusUpdaterProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes || "");

  const handleUpdate = async (newStatus?: typeof currentStatus) => {
    const statusToUpdate = newStatus || status;
    setLoading(true);
    if (newStatus) setStatus(newStatus);

    const res = await updateLifeCoachStatus(requestId, statusToUpdate, notes);
    
    if (res.success) {
      toast.success(res.message || "Updated successfully");
    } else {
      toast.error(res.error || "Failed to update");
      if (newStatus) setStatus(currentStatus); // Revert status on failure
    }
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 w-full md:w-auto">
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold text-slate-400 uppercase">Status:</label>
        <div className="relative">
          <select
            value={status}
            onChange={(e) => handleUpdate(e.target.value as any)}
            disabled={loading}
            className={`appearance-none pl-4 pr-8 py-2 rounded-xl text-sm font-bold uppercase tracking-wider outline-none cursor-pointer border transition-all ${
              status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
              status === "CONTACTED" ? "bg-blue-50 text-blue-700 border-blue-200" :
              status === "MESSAGED" ? "bg-teal-50 text-teal-700 border-teal-200" :
              status === "CALLED" ? "bg-cyan-50 text-cyan-700 border-cyan-200" :
              status === "RESOLVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              status === "JUNK" ? "bg-red-50 text-red-700 border-red-200" :
              "bg-slate-100 text-slate-700 border-slate-300" // DNP
            } disabled:opacity-50`}
          >
            <option value="PENDING">Pending</option>
            <option value="CONTACTED">Contacted</option>
            <option value="MESSAGED">Messaged</option>
            <option value="CALLED">Called</option>
            <option value="RESOLVED">Resolved</option>
            <option value="JUNK">Junk</option>
            <option value="DNP">DNP (Did Not Pick)</option>
          </select>
          
          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-3 top-1/2 -translate-y-1/2 opacity-70" />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-400 uppercase">Admin Notes:</label>
        <div className="relative">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes, suggestions, or issues..."
            className="w-full md:w-80 h-24 p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 resize-none transition-all"
          />
          <button 
            onClick={() => handleUpdate()}
            disabled={loading}
            className="absolute bottom-3 right-3 p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
            title="Save Notes"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}