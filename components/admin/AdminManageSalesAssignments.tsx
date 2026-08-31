"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  FolderTree,
  Trash2,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CalendarDays,
  Search,
  Filter,
  Loader2,
  CheckCircle2,
  Clock,
  X,
  Sparkles,
} from "lucide-react";
import { SalesStatusBadge } from "@/components/sales/SalesStatusBadge";
import { formatIST } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InstituteItem {
  id: string; // SalesAssignment ID
  contactStatus: string;
  interest?: string | null;
  remark?: string | null;
  onboardedPlan?: string | null;
  deadline?: string | Date | null;
  areaAssignmentId?: string | null;
  areaAssignment?: {
    id: string;
    areaName: string;
    radiusKm: number;
  } | null;
  institute: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: { name: string } | null;
    categories?: { category: { name: string } }[];
  };
}

interface AreaItem {
  id: string;
  areaName: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  deadline?: string | Date | null;
  createdAt: string | Date;
  institutes: InstituteItem[];
}

interface CategoryItem {
  id: string;
  deadline?: string | Date | null;
  createdAt: string | Date;
  category: {
    id: string;
    name: string;
  };
}

interface Props {
  salesManagerId: string;
  salesManagerName: string;
  initialAssignments: InstituteItem[];
  initialAreas: AreaItem[];
  initialCategories: CategoryItem[];
}

export default function AdminManageSalesAssignments({
  salesManagerId,
  salesManagerName,
  initialAssignments,
  initialAreas,
  initialCategories,
}: Props) {
  const router = useRouter();

  const [assignments, setAssignments] = useState<InstituteItem[]>(initialAssignments);
  const [areas, setAreas] = useState<AreaItem[]>(initialAreas);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);

  // Multi-select for general institutes table
  const [selectedInstIds, setSelectedInstIds] = useState<Set<string>>(new Set());

  // Multi-select per area (areaId -> Set of assignmentIds)
  const [selectedInArea, setSelectedInArea] = useState<Record<string, Set<string>>>({});

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [areaFilter, setAreaFilter] = useState("ALL");

  // Loading States
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    actionType: "bulk_institutes" | "single_institute" | "area_whole" | "area_institutes_only" | "category" | "all";
    payload: any;
  } | null>(null);

  const now = new Date();

  // --- Filtering Logic ---
  const filteredAssignments = assignments.filter((a) => {
    if (statusFilter !== "ALL" && a.contactStatus !== statusFilter) return false;
    if (areaFilter !== "ALL") {
      if (areaFilter === "DIRECT" && a.areaAssignmentId) return false;
      if (areaFilter !== "DIRECT" && a.areaAssignmentId !== areaFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = a.institute.name.toLowerCase();
      const city = a.institute.city?.name?.toLowerCase() || "";
      const address = a.institute.address?.toLowerCase() || "";
      return name.includes(q) || city.includes(q) || address.includes(q);
    }
    return true;
  });

  // --- Selection Handlers for Main Table ---
  const toggleSelectAll = () => {
    if (selectedInstIds.size === filteredAssignments.length) {
      setSelectedInstIds(new Set());
    } else {
      setSelectedInstIds(new Set(filteredAssignments.map((a) => a.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedInstIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedInstIds(next);
  };

  // --- Selection Handlers for Area-specific table ---
  const toggleSelectInArea = (areaId: string, assignmentId: string) => {
    const currentSet = new Set(selectedInArea[areaId] || []);
    if (currentSet.has(assignmentId)) currentSet.delete(assignmentId);
    else currentSet.add(assignmentId);
    setSelectedInArea({ ...selectedInArea, [areaId]: currentSet });
  };

  const toggleSelectAllInArea = (area: AreaItem) => {
    const currentSet = selectedInArea[area.id] || new Set();
    if (currentSet.size === area.institutes.length) {
      setSelectedInArea({ ...selectedInArea, [area.id]: new Set() });
    } else {
      setSelectedInArea({ ...selectedInArea, [area.id]: new Set(area.institutes.map((i) => i.id)) });
    }
  };

  // --- API Execution ---
  const executeRemoval = async () => {
    if (!confirmModal) return;
    setLoadingAction("executing");

    try {
      let bodyPayload: any = {};

      if (confirmModal.actionType === "bulk_institutes") {
        bodyPayload = {
          type: "bulk_institutes",
          assignmentIds: confirmModal.payload.assignmentIds,
        };
      } else if (confirmModal.actionType === "single_institute") {
        bodyPayload = {
          type: "institute",
          assignmentId: confirmModal.payload.assignmentId,
        };
      } else if (confirmModal.actionType === "area_whole") {
        bodyPayload = {
          type: "area",
          assignmentId: confirmModal.payload.areaId,
          deleteLinkedInstitutes: true,
        };
      } else if (confirmModal.actionType === "area_institutes_only") {
        bodyPayload = {
          type: "bulk_institutes",
          assignmentIds: confirmModal.payload.assignmentIds,
        };
      } else if (confirmModal.actionType === "category") {
        bodyPayload = {
          type: "category",
          assignmentId: confirmModal.payload.categoryId,
        };
      } else if (confirmModal.actionType === "all") {
        bodyPayload = {
          type: "all",
          salesManagerId,
        };
      }

      const res = await fetch("/api/sales/remove-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove assignment");
      }

      setConfirmModal(null);
      setSelectedInstIds(new Set());
      setSelectedInArea({});
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── TOP MASTER ACTIONS ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-stone-50 border border-stone-200/80 rounded-2xl">
        <div>
          <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
            <span>Assignment Control & Unassignment</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Remove individual institutes, unassign selective areas, or perform a complete assignment reset.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setConfirmModal({
              isOpen: true,
              title: "Wipe All Assignments?",
              description: `Are you sure you want to completely remove ALL assigned institutes (${assignments.length}), areas (${areas.length}), and categories (${categories.length}) from ${salesManagerName}? This cannot be undone.`,
              confirmText: "Yes, Delete Whole Assignment",
              actionType: "all",
              payload: {},
            })
          }
          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset All Assignments</span>
        </button>
      </div>

      {/* ─── 1. AREA ASSIGNMENTS (WITH WHOLE & SELECTIVE OPTIONS) ─── */}
      {areas.length > 0 && (
        <Card className="border-stone-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-stone-50 border-b border-stone-100 p-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-stone-800">
              <MapPin className="w-5 h-5 text-rose-500" /> Assigned Areas ({areas.length})
            </CardTitle>
            <span className="text-xs text-stone-500 font-bold bg-white px-2.5 py-1 rounded-lg border border-stone-200">
              {areas.reduce((acc, a) => acc + a.institutes.length, 0)} total institutes in areas
            </span>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {areas.map((area) => {
              const totalInArea = area.institutes.length;
              const selectedThisArea = selectedInArea[area.id] || new Set();
              const hasAreaSelection = selectedThisArea.size > 0;

              return (
                <div key={area.id} className="border border-stone-200 rounded-2xl p-4 bg-stone-50/50 space-y-3">
                  {/* Area Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-stone-800">{area.areaName}</h4>
                          <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                            {area.radiusKm} km radius
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone-400 mt-0.5">
                          <span>Assigned: {formatIST(area.createdAt, "MMM dd, yyyy")}</span>
                          {area.deadline && (
                            <span className="flex items-center gap-1 text-stone-600 font-medium">
                              <CalendarDays className="w-3 h-3 text-stone-400" />
                              Deadline: {formatIST(area.deadline, "MMM dd, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Area Actions: Option 1 (Whole) vs Option 2 (Selective) */}
                    <div className="flex items-center gap-2">
                      {/* Option 2: Remove Selective from Area */}
                      {hasAreaSelection && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              title: `Remove ${selectedThisArea.size} Selected Institutes?`,
                              description: `Unassign the ${selectedThisArea.size} selected institutes from ${area.areaName}? The remaining institutes in this area will stay assigned.`,
                              confirmText: `Remove ${selectedThisArea.size} Institutes`,
                              actionType: "area_institutes_only",
                              payload: { assignmentIds: Array.from(selectedThisArea) },
                            })
                          }
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 animate-in fade-in"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Remove Selected ({selectedThisArea.size})</span>
                        </button>
                      )}

                      {/* Option 1: Delete Whole Area Assignment */}
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmModal({
                            isOpen: true,
                            title: `Delete Entire Area "${area.areaName}"?`,
                            description: `This will remove the whole Area assignment AND all ${totalInArea} linked institutes from ${salesManagerName}.`,
                            confirmText: "Delete Whole Area & All Institutes",
                            actionType: "area_whole",
                            payload: { areaId: area.id },
                          })
                        }
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                        title="Delete entire area assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Whole Area</span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Institutes List in Area with Checkboxes */}
                  {totalInArea > 0 && (
                    <details className="group border-t border-stone-200/80 pt-2" open>
                      <summary className="cursor-pointer text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center justify-between py-1 select-none">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-stone-700">
                            Selectively remove institutes ({totalInArea} institutes in this area):
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleSelectAllInArea(area);
                            }}
                            className="text-[11px] font-bold text-stone-500 hover:text-stone-900 underline mr-2"
                          >
                            {selectedThisArea.size === totalInArea ? "Deselect All" : "Select All in Area"}
                          </button>
                          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-stone-400" />
                        </div>
                      </summary>

                      <div className="mt-2 divide-y divide-stone-100 bg-white rounded-xl border border-stone-200 overflow-hidden">
                        {area.institutes.map((item) => {
                          const isChecked = selectedThisArea.has(item.id);
                          return (
                            <div
                              key={item.id}
                              className={`p-3 flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${
                                isChecked ? "bg-amber-50/50" : "hover:bg-stone-50/50"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => toggleSelectInArea(area.id, item.id)}
                                  className="text-stone-400 hover:text-stone-900 p-0.5"
                                >
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-amber-600" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                                <div>
                                  <p className="font-bold text-stone-800 text-sm truncate">{item.institute.name}</p>
                                  <p className="text-stone-500 text-[11px] truncate">
                                    {item.institute.address || item.institute.city?.name}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <SalesStatusBadge status={item.contactStatus} />

                                {/* Direct Individual Remove */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmModal({
                                      isOpen: true,
                                      title: `Remove "${item.institute.name}"?`,
                                      description: `Unassign this particular institute from ${salesManagerName}?`,
                                      confirmText: "Remove Institute",
                                      actionType: "single_institute",
                                      payload: { assignmentId: item.id },
                                    })
                                  }
                                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Remove this particular institute"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ─── 2. CATEGORY ASSIGNMENTS ─── */}
      {categories.length > 0 && (
        <Card className="border-stone-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-stone-50 border-b border-stone-100 p-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-stone-800">
              <FolderTree className="w-5 h-5 text-stone-500" /> Assigned Categories ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2.5">
              {categories.map((ca) => (
                <div
                  key={ca.id}
                  className="inline-flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 shadow-sm"
                >
                  <span className="text-sm font-bold text-stone-800">{ca.category.name}</span>
                  {ca.deadline && (
                    <span className="text-[10px] font-bold text-stone-500 flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                      <CalendarDays className="w-3 h-3" />
                      {formatIST(ca.deadline, "MMM dd")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmModal({
                        isOpen: true,
                        title: `Remove Category "${ca.category.name}"?`,
                        description: `Unassign the category "${ca.category.name}" from ${salesManagerName}?`,
                        confirmText: "Remove Category",
                        actionType: "category",
                        payload: { categoryId: ca.id },
                      })
                    }
                    className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── 3. ALL ASSIGNED INSTITUTES (MULTI-SELECT & SELECTIVE REMOVAL) ─── */}
      <Card className="border-stone-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-stone-50 border-b border-stone-100 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-stone-800">
                <Building2 className="w-5 h-5 text-stone-500" /> Assigned Institutes Portfolio
              </CardTitle>
              <p className="text-xs text-stone-500 mt-0.5">
                Select particular institutes to unassign individually or in bulk.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-bold bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                {assignments.length} total institutes
              </span>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search institute name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="NOT_CONTACTED">Not Contacted</option>
              <option value="CONTACTED">Contacted</option>
              <option value="IN_PROCESS">In Process</option>
              <option value="ONBOARDED">Onboarded</option>
            </select>

            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="ALL">All Sources (Area + Direct)</option>
              <option value="DIRECT">Directly Assigned Only</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  Area: {a.areaName}
                </option>
              ))}
            </select>
          </div>

          {/* ⚡ FLOATING / STICKY BULK ACTION BAR ⚡ */}
          {selectedInstIds.size > 0 && (
            <div className="mt-4 p-3 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-extrabold">
                  {selectedInstIds.size} of {filteredAssignments.length} institutes selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInstIds(new Set())}
                  className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Clear Selection
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmModal({
                      isOpen: true,
                      title: `Remove ${selectedInstIds.size} Selected Institutes?`,
                      description: `Are you sure you want to unassign these ${selectedInstIds.size} specific institutes from ${salesManagerName}?`,
                      confirmText: `Remove Selected (${selectedInstIds.size})`,
                      actionType: "bulk_institutes",
                      payload: { assignmentIds: Array.from(selectedInstIds) },
                    })
                  }
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Selected ({selectedInstIds.size})</span>
                </button>
              </div>
            </div>
          )}
        </CardHeader>

        {filteredAssignments.length === 0 ? (
          <CardContent className="p-8 text-center text-stone-400 text-sm italic">
            No institutes match the filter criteria.
          </CardContent>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-100 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-10">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-stone-400 hover:text-stone-900"
                    >
                      {selectedInstIds.size === filteredAssignments.length ? (
                        <CheckSquare className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Institute</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4">Remark</th>
                  <th className="p-4 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredAssignments.map((a) => {
                  const isSelected = selectedInstIds.has(a.id);
                  const isOverdue =
                    a.deadline && new Date(a.deadline) < now && a.contactStatus !== "ONBOARDED";

                  return (
                    <tr
                      key={a.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-amber-50/60"
                          : isOverdue
                          ? "bg-rose-50/30 hover:bg-rose-50/50"
                          : "hover:bg-stone-50/50"
                      }`}
                    >
                      <td className="p-4 align-top">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(a.id)}
                          className="text-stone-400 hover:text-stone-900"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-4 align-top">
                        <div>
                          <div className="font-bold text-stone-800 text-sm">{a.institute.name}</div>
                          <div className="text-xs text-stone-500 flex flex-wrap items-center gap-2 mt-1">
                            <span className="font-medium">{a.institute.city?.name}</span>
                            {a.institute.categories?.[0] && (
                              <span className="bg-stone-100 px-1.5 py-0.5 rounded text-[10px] font-bold border border-stone-200">
                                {a.institute.categories[0].category.name}
                              </span>
                            )}
                            {a.areaAssignment && (
                              <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-rose-200 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                {a.areaAssignment.areaName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <SalesStatusBadge status={a.contactStatus} />
                        {a.onboardedPlan && (
                          <span className="block mt-2 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded w-fit border border-emerald-100">
                            Plan: {a.onboardedPlan}
                          </span>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        {a.deadline ? (
                          <span
                            className={`text-xs flex items-center gap-1.5 bg-white w-fit px-2 py-1 rounded border ${
                              isOverdue
                                ? "text-rose-600 font-bold border-rose-200 shadow-sm"
                                : "text-stone-600 font-medium border-stone-200"
                            }`}
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            {formatIST(a.deadline, "MMM dd, yyyy")}
                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 ml-1" />}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400 italic">No deadline</span>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        <span className="text-xs text-stone-600 line-clamp-2 max-w-[200px] leading-relaxed">
                          {a.remark || "—"}
                        </span>
                      </td>
                      <td className="p-4 align-top text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              title: `Remove "${a.institute.name}"?`,
                              description: `Unassign this institute from ${salesManagerName}?`,
                              confirmText: "Remove Institute",
                              actionType: "single_institute",
                              payload: { assignmentId: a.id },
                            })
                          }
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title={`Remove ${a.institute.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ─── CONFIRMATION MODAL ─── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xl">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-lg text-stone-900 leading-tight">
                {confirmModal.title}
              </h3>
              <p className="text-xs font-semibold text-stone-500 mt-1.5 leading-relaxed">
                {confirmModal.description}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={loadingAction !== null}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={executeRemoval}
                disabled={loadingAction !== null}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-rose-600/25 transition-all flex items-center gap-2"
              >
                {loadingAction ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <span>{confirmModal.confirmText}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
