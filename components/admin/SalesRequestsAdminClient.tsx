"use client";

import React, { useState } from "react";
import { Building2, MapPin, Layers, Clock, CheckCircle2, XCircle, Search, Filter, Calendar, MessageSquare, AlertCircle, Loader2, Check, X, ArrowRight, User } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface RequestItem {
  id: string;
  type: "INSTITUTE" | "AREA" | "CATEGORY";
  status: "PENDING" | "APPROVED" | "REJECTED";
  institute?: {
    id: string;
    name: string;
    slug?: string;
    address?: string;
    logo?: string;
    city?: { name: string };
    categories?: { category: { name: string } }[];
  } | null;
  areaName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number | null;
  category?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  salesManager: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    image?: string | null;
  };
  reason?: string | null;
  adminRemark?: string | null;
  reviewedAt?: string | Date | null;
  reviewedBy?: { id: string; name: string } | null;
  createdAt: string | Date;
}

interface Props {
  initialRequests: RequestItem[];
}

export default function SalesRequestsAdminClient({ initialRequests }: Props) {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INSTITUTE" | "AREA" | "CATEGORY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Action Modal State
  const [activeActionModal, setActiveActionModal] = useState<{
    request: RequestItem;
    action: "APPROVE" | "REJECT";
  } | null>(null);
  const [actionRemark, setActionRemark] = useState("");
  const [deadline, setDeadline] = useState("");
  const [includeReassign, setIncludeReassign] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const smName = r.salesManager?.name?.toLowerCase() || "";
      const smEmail = r.salesManager?.email?.toLowerCase() || "";
      const instName = r.institute?.name?.toLowerCase() || "";
      const area = r.areaName?.toLowerCase() || "";
      const cat = r.category?.name?.toLowerCase() || "";
      return smName.includes(q) || smEmail.includes(q) || instName.includes(q) || area.includes(q) || cat.includes(q);
    }
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActionModal) return;

    setActionError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/sales/request-assignment/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: activeActionModal.request.id,
          action: activeActionModal.action,
          adminRemark: actionRemark.trim() || undefined,
          deadline: deadline || undefined,
          includeReassign,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process action");
      }

      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === activeActionModal.request.id
            ? {
                ...r,
                status: activeActionModal.action === "APPROVE" ? "APPROVED" : "REJECTED",
                adminRemark: actionRemark.trim() || null,
                reviewedAt: new Date().toISOString(),
              }
            : r
        )
      );

      setActiveActionModal(null);
      setActionRemark("");
      setDeadline("");
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to process action");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span>⚡ Sales Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Sales Assignment Requests
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Review and approve incoming institute, area, and category assignment requests from Sales Managers.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="px-5 py-3 rounded-2xl bg-amber-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span>{pendingCount} Pending Requests</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/70 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Received</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{requests.length}</p>
        </div>

        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-sm">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Review</p>
          <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">{pendingCount}</p>
        </div>

        <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Approved</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">{approvedCount}</p>
        </div>

        <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 shadow-sm">
          <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Rejected</p>
          <p className="text-2xl sm:text-3xl font-black text-rose-900 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search manager, institute, or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st === "PENDING" && `Pending (${pendingCount})`}
              {st === "APPROVED" && `Approved (${approvedCount})`}
              {st === "REJECTED" && `Rejected (${rejectedCount})`}
              {st === "ALL" && "All"}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {(["ALL", "INSTITUTE", "AREA", "CATEGORY"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                typeFilter === t
                  ? "bg-amber-400/15 border-amber-400 text-amber-900"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {t === "ALL" && "All Types"}
              {t === "INSTITUTE" && "Institutes"}
              {t === "AREA" && "Areas"}
              {t === "CATEGORY" && "Categories"}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/70 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-4 font-black text-2xl">
            📋
          </div>
          <h3 className="text-lg font-black text-slate-900">No requests found</h3>
          <p className="text-sm font-semibold text-slate-500 mt-1 max-w-md mx-auto">
            There are no sales assignment requests matching your current filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => {
            const isPending = req.status === "PENDING";
            const isApproved = req.status === "APPROVED";
            const isRejected = req.status === "REJECTED";

            return (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Sales Manager Name & Status */}
                  <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                        {req.salesManager?.name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                          {req.salesManager?.name || "Sales Manager"}
                        </h4>
                        <p className="text-[11px] font-semibold text-slate-400 truncate">
                          {req.salesManager?.email}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        isPending
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : isApproved
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {isPending && <Clock size={13} />}
                      {isApproved && <CheckCircle2 size={13} />}
                      {isRejected && <XCircle size={13} />}
                      {req.status}
                    </span>
                  </div>

                  {/* Request Target Item */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          req.type === "INSTITUTE"
                            ? "bg-blue-50 text-blue-700"
                            : req.type === "AREA"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {req.type === "INSTITUTE" && <Building2 size={12} />}
                        {req.type === "AREA" && <MapPin size={12} />}
                        {req.type === "CATEGORY" && <Layers size={12} />}
                        {req.type} REQUEST
                      </span>
                    </div>

                    {req.type === "INSTITUTE" && (
                      <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 font-black text-slate-700">
                          {req.institute?.logo ? (
                            <img src={req.institute.logo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 size={20} className="text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-900">{req.institute?.name || "Institute"}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{req.institute?.address || req.institute?.city?.name || "No address"}</p>
                        </div>
                      </div>
                    )}

                    {req.type === "AREA" && (
                      <div className="flex items-start gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-900">{req.areaName || "Assigned Area"}</p>
                          <p className="text-xs text-emerald-700 font-semibold">
                            Radius: {req.radiusKm || 3} km coverage
                            {req.latitude && req.longitude ? ` • (${req.latitude.toFixed(4)}, ${req.longitude.toFixed(4)})` : ""}
                          </p>
                        </div>
                      </div>
                    )}

                    {req.type === "CATEGORY" && (
                      <div className="flex items-start gap-3 p-3 bg-purple-50/50 border border-purple-100 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-white border border-purple-200 flex items-center justify-center text-purple-600 flex-shrink-0">
                          <Layers size={20} />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-900">{req.category?.name || "Category"}</p>
                          <p className="text-xs text-purple-700 font-semibold">Assign key manager for all category institutes</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sales Manager Reason */}
                  {req.reason && (
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Manager Pitch</p>
                      <p className="text-xs font-medium text-slate-700 italic">"{req.reason}"</p>
                    </div>
                  )}

                  {/* Admin Remark (if already reviewed) */}
                  {req.adminRemark && (
                    <div
                      className={`p-3.5 rounded-2xl mb-3 border ${
                        isApproved
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                          : "bg-rose-50/70 border-rose-200 text-rose-900"
                      }`}
                    >
                      <p className="text-[10px] font-extrabold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <MessageSquare size={11} />
                        Admin Remark ({req.reviewedBy?.name || "Admin"})
                      </p>
                      <p className="text-xs font-semibold">{req.adminRemark}</p>
                    </div>
                  )}
                </div>

                {/* Footer Actions or Timestamps */}
                <div className="pt-3 mt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-semibold text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Requested {format(new Date(req.createdAt), "dd MMM yyyy, hh:mm a")}</span>
                  </div>

                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveActionModal({ request: req, action: "REJECT" })}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-colors flex items-center gap-1"
                      >
                        <X size={13} />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveActionModal({ request: req, action: "APPROVE" })}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-colors flex items-center gap-1.5"
                      >
                        <Check size={13} />
                        <span>Approve & Assign</span>
                      </button>
                    </div>
                  ) : (
                    req.reviewedAt && (
                      <span className="text-slate-500">
                        {req.status === "APPROVED" ? "Approved" : "Rejected"} on {format(new Date(req.reviewedAt), "dd MMM yyyy")}
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Approval / Rejection Modal */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div
              className={`px-6 py-5 border-b flex items-center justify-between ${
                activeActionModal.action === "APPROVE"
                  ? "bg-emerald-50/70 border-emerald-100 text-emerald-950"
                  : "bg-rose-50/70 border-rose-100 text-rose-950"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                    activeActionModal.action === "APPROVE"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                      : "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                  }`}
                >
                  {activeActionModal.action === "APPROVE" ? <Check size={20} /> : <X size={20} />}
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">
                    {activeActionModal.action === "APPROVE" ? "Approve Assignment Request" : "Reject Request"}
                  </h3>
                  <p className="text-xs font-semibold opacity-75">
                    Assigning to {activeActionModal.request.salesManager?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="p-1.5 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
              {/* Target Summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  Requested Target
                </p>
                <p className="text-sm font-extrabold text-slate-900">
                  {activeActionModal.request.type === "INSTITUTE" && activeActionModal.request.institute?.name}
                  {activeActionModal.request.type === "AREA" && `${activeActionModal.request.areaName} (${activeActionModal.request.radiusKm || 3} km)`}
                  {activeActionModal.request.type === "CATEGORY" && activeActionModal.request.category?.name}
                </p>
              </div>

              {/* Approval Options */}
              {activeActionModal.action === "APPROVE" && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Target Completion Deadline (Optional)
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  {activeActionModal.request.type === "AREA" && (
                    <label className="flex items-center gap-2.5 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeReassign}
                        onChange={(e) => setIncludeReassign(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-emerald-950">
                        Include institutes in this area even if assigned to another manager
                      </span>
                    </label>
                  )}
                </>
              )}

              {/* Admin Remark / Feedback */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  {activeActionModal.action === "APPROVE" ? "Remark for Sales Manager (Optional)" : "Rejection Reason (Optional)"}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    activeActionModal.action === "APPROVE"
                      ? "e.g. Approved. Focus on onboarding top 5 institutes by month end."
                      : "e.g. This area is already actively being worked on by another team."
                  }
                  value={actionRemark}
                  onChange={(e) => setActionRemark(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveActionModal(null)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2.5 rounded-xl text-sm font-extrabold text-white shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 ${
                    activeActionModal.action === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : activeActionModal.action === "APPROVE" ? (
                    <>
                      <Check size={16} />
                      Confirm Approval
                    </>
                  ) : (
                    <>
                      <X size={16} />
                      Confirm Rejection
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
