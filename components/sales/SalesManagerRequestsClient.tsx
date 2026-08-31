"use client";

import React, { useState } from "react";
import { Building2, MapPin, Layers, Clock, CheckCircle2, XCircle, Plus, Sparkles, Filter, Calendar, MessageSquare, AlertCircle } from "lucide-react";
import RequestAssignmentModal from "@/components/sales/RequestAssignmentModal";
import { format } from "date-fns";

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
  reason?: string | null;
  adminRemark?: string | null;
  reviewedAt?: string | Date | null;
  reviewedBy?: { id: string; name: string } | null;
  createdAt: string | Date;
}

interface Props {
  salesManagerId: string;
  initialRequests: RequestItem[];
  categories: { id: string; name: string }[];
}

export default function SalesManagerRequestsClient({
  salesManagerId,
  initialRequests,
  categories,
}: Props) {
  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INSTITUTE" | "AREA" | "CATEGORY">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  const refreshRequests = async () => {
    try {
      const res = await fetch(`/api/sales/request-assignment?salesManagerId=${salesManagerId}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span>⚡ Self-Assignment Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Assignment Requests</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Request Admin to assign specific institutes, geographical areas, or coaching categories to your portfolio.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 transition-all flex items-center gap-2 flex-shrink-0"
        >
          <Plus size={18} />
          <span>New Assignment Request</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Requests</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{requests.length}</p>
        </div>

        <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-100 shadow-sm">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Review</p>
          <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">{pendingCount}</p>
        </div>

        <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Approved</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">{approvedCount}</p>
        </div>

        <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-100 shadow-sm">
          <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Rejected</p>
          <p className="text-2xl sm:text-3xl font-black text-rose-900 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st === "ALL" && "All Statuses"}
              {st === "PENDING" && `Pending (${pendingCount})`}
              {st === "APPROVED" && `Approved (${approvedCount})`}
              {st === "REJECTED" && `Rejected (${rejectedCount})`}
            </button>
          ))}
        </div>

        {/* Type Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {(["ALL", "INSTITUTE", "AREA", "CATEGORY"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
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
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 font-black text-2xl">
            📋
          </div>
          <h3 className="text-lg font-black text-slate-900">No assignment requests found</h3>
          <p className="text-sm font-semibold text-slate-500 mt-1 max-w-md mx-auto">
            {statusFilter !== "ALL" || typeFilter !== "ALL"
              ? "Try changing your active filters to view your requests."
              : "You haven't requested any institute, area, or category assignments yet. Click the button below to get started!"}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-5 px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-amber-500/25 hover:bg-amber-600 transition-all inline-flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create First Request</span>
          </button>
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
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Type Badge & Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                        req.type === "INSTITUTE"
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : req.type === "AREA"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-purple-50 text-purple-700 border border-purple-100"
                      }`}
                    >
                      {req.type === "INSTITUTE" && <Building2 size={13} />}
                      {req.type === "AREA" && <MapPin size={13} />}
                      {req.type === "CATEGORY" && <Layers size={13} />}
                      {req.type}
                    </span>

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

                  {/* Target Details */}
                  <div className="mb-4">
                    {req.type === "INSTITUTE" && (
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-black text-slate-700 flex-shrink-0 overflow-hidden">
                          {req.institute?.logo ? (
                            <img src={req.institute.logo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 size={22} className="text-slate-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 leading-tight">
                            {req.institute?.name || "Institute"}
                          </h4>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5 line-clamp-1">
                            {req.institute?.address || req.institute?.city?.name || "Address not specified"}
                          </p>
                        </div>
                      </div>
                    )}

                    {req.type === "AREA" && (
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 leading-tight">
                            {req.areaName || "Assigned Area"}
                          </h4>
                          <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                            {req.radiusKm || 3} km radius coverage
                            {req.latitude && req.longitude
                              ? ` • (${req.latitude.toFixed(2)}, ${req.longitude.toFixed(2)})`
                              : ""}
                          </p>
                        </div>
                      </div>
                    )}

                    {req.type === "CATEGORY" && (
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                          <Layers size={24} />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 leading-tight">
                            {req.category?.name || "Category"}
                          </h4>
                          <p className="text-xs font-semibold text-purple-700 mt-0.5">
                            Key Account Manager for this category
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reason text */}
                  {req.reason && (
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl mb-3">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">My Note / Pitch</p>
                      <p className="text-xs font-medium text-slate-700 italic">"{req.reason}"</p>
                    </div>
                  )}

                  {/* Admin Remark / Feedback */}
                  {req.adminRemark && (
                    <div
                      className={`p-3.5 rounded-2xl mb-3 border ${
                        isApproved
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                          : "bg-rose-50/70 border-rose-200 text-rose-900"
                      }`}
                    >
                      <p className="text-[11px] font-extrabold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <MessageSquare size={12} />
                        Admin Feedback
                      </p>
                      <p className="text-xs font-semibold">{req.adminRemark}</p>
                    </div>
                  )}
                </div>

                {/* Footer Timestamps */}
                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Requested {format(new Date(req.createdAt), "dd MMM yyyy, hh:mm a")}</span>
                  </div>

                  {req.reviewedAt && (
                    <span>
                      Reviewed {format(new Date(req.reviewedAt), "dd MMM yyyy")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <RequestAssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        salesManagerId={salesManagerId}
        categories={categories}
        onSuccess={refreshRequests}
      />
    </div>
  );
}
