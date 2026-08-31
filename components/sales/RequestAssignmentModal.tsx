"use client";

import React, { useState, useEffect, useRef } from "react";
import { Building2, MapPin, Layers, Send, X, AlertCircle, CheckCircle, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface CategoryOption {
  id: string;
  name: string;
  slug?: string;
}

interface RequestAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesManagerId?: string;
  categories?: CategoryOption[];
  onSuccess?: () => void;
}

export default function RequestAssignmentModal({
  isOpen,
  onClose,
  salesManagerId,
  categories = [],
  onSuccess,
}: RequestAssignmentModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"INSTITUTE" | "AREA" | "CATEGORY">("INSTITUTE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State: Reason
  const [reason, setReason] = useState("");

  // Institute Search State
  const [instQuery, setInstQuery] = useState("");
  const [instLoading, setInstLoading] = useState(false);
  const [instResults, setInstResults] = useState<any[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<any | null>(null);

  // Area Search State
  const [areaQuery, setAreaQuery] = useState("");
  const [areaLoading, setAreaLoading] = useState(false);
  const [areaPredictions, setAreaPredictions] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState<{
    areaName: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(3);

  // Category State
  const [allCategories, setAllCategories] = useState<CategoryOption[]>(categories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Fetch categories if empty
  useEffect(() => {
    if (categories.length > 0) {
      setAllCategories(categories);
      if (!selectedCategoryId) setSelectedCategoryId(categories[0].id);
    } else {
      fetch("/api/mobile/categories")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const flatCats: CategoryOption[] = [];
            data.data.forEach((c: any) => {
              flatCats.push({ id: c.id, name: c.name, slug: c.slug });
              if (c.children) {
                c.children.forEach((child: any) => {
                  flatCats.push({ id: child.id, name: `${c.name} > ${child.name}`, slug: child.slug });
                });
              }
            });
            setAllCategories(flatCats);
            if (flatCats.length > 0 && !selectedCategoryId) {
              setSelectedCategoryId(flatCats[0].id);
            }
          }
        })
        .catch((err) => console.error("Error fetching categories:", err));
    }
  }, [categories]);

  // Institute search debouncing
  useEffect(() => {
    if (instQuery.trim().length < 2) {
      setInstResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setInstLoading(true);
      try {
        const res = await fetch(`/api/mobile/search?q=${encodeURIComponent(instQuery.trim())}&limit=8`);
        const data = await res.json();
        if (data.success && data.data) {
          const hits = data.data.results || data.data.institutes || [];
          setInstResults(hits.filter((h: any) => h._type === "institute" || !h._type));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInstLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [instQuery]);

  // Area search debouncing
  useEffect(() => {
    if (areaQuery.trim().length < 2) {
      setAreaPredictions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setAreaLoading(true);
      try {
        const res = await fetch(`/api/admin/area-search?q=${encodeURIComponent(areaQuery.trim())}`);
        const data = await res.json();
        if (data.predictions) {
          setAreaPredictions(data.predictions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAreaLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [areaQuery]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validation
    if (activeTab === "INSTITUTE" && !selectedInstitute) {
      setError("Please search and select an Institute to request.");
      return;
    }

    if (activeTab === "AREA" && !selectedArea) {
      setError("Please search and select a specific Area or Locality.");
      return;
    }

    if (activeTab === "CATEGORY" && !selectedCategoryId) {
      setError("Please select a Category from the dropdown.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        type: activeTab,
        reason: reason.trim() || undefined,
        salesManagerId,
      };

      if (activeTab === "INSTITUTE" && selectedInstitute) {
        payload.instituteId = selectedInstitute.id;
      } else if (activeTab === "AREA" && selectedArea) {
        payload.areaName = selectedArea.areaName;
        payload.latitude = selectedArea.latitude;
        payload.longitude = selectedArea.longitude;
        payload.radiusKm = radiusKm;
      } else if (activeTab === "CATEGORY") {
        payload.categoryId = selectedCategoryId;
      }

      const res = await fetch("/api/sales/request-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit assignment request");
      }

      setSuccessMsg("Assignment request sent to Admin successfully! 🎉");
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        router.refresh();
      }, 1400);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-600 font-black">
              ⚡
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Request New Assignment</h2>
              <p className="text-xs font-semibold text-slate-500">Ask admin to assign an institute, area, or category</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Assignment Type
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100/80 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("INSTITUTE");
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "INSTITUTE"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 size={16} className={activeTab === "INSTITUTE" ? "text-amber-500" : ""} />
                Institute
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("AREA");
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "AREA"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MapPin size={16} className={activeTab === "AREA" ? "text-emerald-500" : ""} />
                Area / Geo
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("CATEGORY");
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "CATEGORY"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers size={16} className={activeTab === "CATEGORY" ? "text-purple-500" : ""} />
                Category
              </button>
            </div>
          </div>

          {/* TAB 1: INSTITUTE SELECTOR */}
          {activeTab === "INSTITUTE" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Search Institute <span className="text-amber-600">*</span>
              </label>

              {selectedInstitute ? (
                <div className="flex items-center justify-between p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center overflow-hidden font-black text-amber-700">
                      {selectedInstitute.logo ? (
                        <img src={selectedInstitute.logo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={20} className="text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-slate-900">{selectedInstitute.name}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{selectedInstitute.address || "No address"}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedInstitute(null)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type institute name (e.g. Allen, Aakash, Resonance)..."
                      value={instQuery}
                      onChange={(e) => setInstQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    {instLoading && (
                      <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                    )}
                  </div>

                  {instResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl divide-y divide-slate-100">
                      {instResults.map((inst) => (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => {
                            setSelectedInstitute(inst);
                            setInstQuery("");
                            setInstResults([]);
                          }}
                          className="w-full p-3 text-left hover:bg-amber-50/60 flex items-center gap-3 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                            <Building2 size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{inst.name}</p>
                            <p className="text-xs text-slate-500 truncate">{inst.address || inst.city?.name || "Verified Institute"}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AREA SELECTOR */}
          {activeTab === "AREA" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Target Area / Locality <span className="text-emerald-600">*</span>
                </label>

                {selectedArea ? (
                  <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="font-extrabold text-sm text-slate-900">{selectedArea.areaName}</p>
                        <p className="text-xs text-slate-500">
                          {selectedArea.latitude.toFixed(4)}, {selectedArea.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedArea(null)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search area (e.g. Sector 62 Noida, Laxmi Nagar Delhi)..."
                        value={areaQuery}
                        onChange={(e) => setAreaQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      {areaLoading && (
                        <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                      )}
                    </div>

                    {areaPredictions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl divide-y divide-slate-100">
                        {areaPredictions.map((pred, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={async () => {
                              try {
                                setAreaLoading(true);
                                let lat = pred.lat;
                                let lng = pred.lng;
                                let name = pred.description || pred.structured_formatting?.main_text;

                                if (!lat || !lng) {
                                  const dRes = await fetch(`/api/mobile/location/details?place_id=${pred.place_id}`);
                                  const dData = await dRes.json();
                                  lat = dData.result?.geometry?.location?.lat || 28.5355;
                                  lng = dData.result?.geometry?.location?.lng || 77.3910;
                                  name = dData.result?.formatted_address || name;
                                }

                                setSelectedArea({
                                  areaName: name,
                                  latitude: Number(lat),
                                  longitude: Number(lng),
                                });
                                setAreaQuery("");
                                setAreaPredictions([]);
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setAreaLoading(false);
                              }
                            }}
                            className="w-full p-3 text-left hover:bg-emerald-50/60 flex items-center gap-3 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                              <MapPin size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {pred.structured_formatting?.main_text || pred.description}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {pred.structured_formatting?.secondary_text || "Area"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Radius Slider */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Coverage Radius:</span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                    {radiusKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  All active coaching institutes within {radiusKm} km radius will be requested for assignment.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORY SELECTOR */}
          {activeTab === "CATEGORY" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Select Goal / Category <span className="text-purple-600">*</span>
              </label>

              <div className="relative">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none cursor-pointer"
                >
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                You will be assigned as the key account manager for institutes under this category.
              </p>
            </div>
          )}

          {/* Reason / Pitch */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Reason / Pitch for Admin (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. I have existing director connections in this area / high student density here..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={16} className="flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Request to Admin
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
