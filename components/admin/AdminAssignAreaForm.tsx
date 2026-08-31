"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Loader2,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  X,
  RefreshCcw,
  Map as MapIcon,
} from "lucide-react";
import { Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import AdminLocationAutoComplete from "@/components/admin/AdminLocationAutoComplete";

interface InstitutePreview {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  city: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  distanceKm: number | null;
  status: "FREE" | "ASSIGNED_TO_YOU" | "ASSIGNED_TO_OTHER";
  currentManager: { id: string; name: string } | null;
}

interface PreviewSummary {
  total: number;
  free: number;
  assignedToYou: number;
  assignedToOther: number;
}

interface AdminAssignAreaFormProps {
  salesManagerId: string;
}

const RADIUS_OPTIONS = [1, 2, 3, 5, 10, 15, 25];

// ── Safe Radius Circle Overlay for Mini Preview Map ──────────────────────────
function MiniCircleOverlay({ center, radiusKm }: { center: { lat: number; lng: number }; radiusKm: number }) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map || typeof window === "undefined" || !window.google?.maps) return;

    const lat = Number(center.lat);
    const lng = Number(center.lng);
    const rad = Number(radiusKm);

    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng) || isNaN(rad) || rad <= 0) {
      return;
    }

    try {
      if (!circleRef.current) {
        circleRef.current = new google.maps.Circle({
          map,
          center: { lat, lng },
          radius: rad * 1000,
          fillColor: "#e11d48",
          fillOpacity: 0.12,
          strokeColor: "#e11d48",
          strokeOpacity: 0.8,
          strokeWeight: 2,
        });
      } else {
        circleRef.current.setCenter({ lat, lng });
        circleRef.current.setRadius(rad * 1000);
      }
    } catch (err) {
      console.warn("Error updating circle overlay:", err);
    }

    return () => {
      if (circleRef.current) {
        try {
          circleRef.current.setMap(null);
        } catch {
          // silent cleanup
        }
        circleRef.current = null;
      }
    };
  }, [map, center.lat, center.lng, radiusKm]);

  return null;
}

export default function AdminAssignAreaForm({ salesManagerId }: AdminAssignAreaFormProps) {
  const router = useRouter();

  // Input & Location State
  const [areaName, setAreaName] = useState("");
  const [radiusKm, setRadiusKm] = useState(3);
  const [deadline, setDeadline] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number; displayName: string } | null>(null);

  // Preview & Meilisearch Results State
  const [previewing, setPreviewing] = useState(false);
  const [summary, setSummary] = useState<PreviewSummary | null>(null);
  const [institutes, setInstitutes] = useState<InstitutePreview[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [includeReassign, setIncludeReassign] = useState(false);
  const [showList, setShowList] = useState(true);
  const [showMapPreview, setShowMapPreview] = useState(true);

  // Assignment Execution State
  const [assigning, setAssigning] = useState(false);
  const [result, setResult] = useState<{ assigned: number } | null>(null);
  const [error, setError] = useState("");

  // ── Helper to query Meilisearch & DB for institutes around coords ───────
  const fetchPreviewForCoords = async (lat: number, lng: number, name: string, rKm = radiusKm) => {
    setPreviewing(true);
    setError("");
    setResult(null);

    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius: String(rKm),
        salesManagerId,
        areaName: name.trim(),
      });
      const res = await fetch(`/api/sales/assign-area?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Preview failed");
        return;
      }

      setSummary(data.summary);
      setInstitutes(data.institutes || []);

      // Pre-select all FREE institutes
      const preSelected = new Set<string>();
      for (const inst of (data.institutes || []) as InstitutePreview[]) {
        if (inst.status === "FREE") preSelected.add(inst.id);
      }
      setSelectedIds(preSelected);
    } catch {
      setError("Network error during Meilisearch preview scan.");
    } finally {
      setPreviewing(false);
    }
  };

  // ── Handler when Location is selected from Autocomplete ────────────────
  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    const validLat = Number(lat);
    const validLng = Number(lng);

    if (isNaN(validLat) || isNaN(validLng) || !isFinite(validLat) || !isFinite(validLng)) {
      setError("Selected location has invalid coordinates. Please try another area.");
      return;
    }

    setAreaName(address);
    const newCoords = { lat: validLat, lng: validLng, displayName: address };
    setCoords(newCoords);
    fetchPreviewForCoords(validLat, validLng, address);
  };

  // ── Handle Radius Change ───────────────────────────────────────────────
  const handleRadiusChange = (newRadius: number) => {
    setRadiusKm(newRadius);
    if (coords) {
      fetchPreviewForCoords(coords.lat, coords.lng, coords.displayName, newRadius);
    }
  };

  // ── Toggle Individual Selection ────────────────────────────────────────
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // ── Select / Deselect All ──────────────────────────────────────────────
  const handleSelectAll = (select: boolean) => {
    if (select) {
      const all = new Set<string>();
      for (const inst of institutes) {
        if (inst.status === "FREE" || (includeReassign && inst.status === "ASSIGNED_TO_OTHER")) {
          all.add(inst.id);
        }
      }
      setSelectedIds(all);
    } else {
      setSelectedIds(new Set());
    }
  };

  // ── Execute Assignment ────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!coords) {
      setError("Please search and select an area first.");
      return;
    }

    if (selectedIds.size === 0) {
      setError("Please select at least one institute to assign.");
      return;
    }

    setAssigning(true);
    setError("");

    try {
      const res = await fetch("/api/sales/assign-area", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesManagerId,
          areaName: areaName.trim() || coords.displayName,
          lat: coords.lat,
          lng: coords.lng,
          radiusKm,
          deadline: deadline || undefined,
          includeReassign,
          specificInstituteIds: Array.from(selectedIds),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Assignment failed");
        return;
      }

      setResult({ assigned: data.assigned ?? selectedIds.size });
      router.refresh();
    } catch {
      setError("Network error during assignment.");
    } finally {
      setAssigning(false);
    }
  };

  const handleReset = () => {
    setAreaName("");
    setCoords(null);
    setSummary(null);
    setInstitutes([]);
    setSelectedIds(new Set());
    setResult(null);
    setError("");
  };

  // ── Safe Sanitized Coordinates for Map ────────────────────────────────
  const validCenter = useMemo(() => {
    if (!coords) return null;
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) return null;
    return { lat, lng };
  }, [coords]);

  const validInstitutesWithCoords = useMemo(() => {
    return institutes
      .map((inst) => {
        const lat = typeof inst.latitude === "number" ? inst.latitude : parseFloat(String(inst.latitude || ""));
        const lng = typeof inst.longitude === "number" ? inst.longitude : parseFloat(String(inst.longitude || ""));
        return {
          ...inst,
          parsedLat: lat,
          parsedLng: lng,
        };
      })
      .filter((inst) => !isNaN(inst.parsedLat) && !isNaN(inst.parsedLng) && isFinite(inst.parsedLat) && isFinite(inst.parsedLng));
  }, [institutes]);

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-stone-900 text-base">Assign Area / Geo-Radius</h3>
            <p className="text-xs text-stone-500 font-medium">
              Select locality to search nearby coaching institutes via Meilisearch
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {result && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">
                ✅ {result.assigned} institute{result.assigned !== 1 ? "s" : ""} assigned successfully!
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">Sales manager portfolio has been updated.</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="shrink-0 text-xs text-emerald-700 font-bold hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCcw className="w-3 h-3" /> Assign Another Area
          </button>
        </div>
      )}

      {!result && (
        <>
          {/* Location Autocomplete Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Search Area / Locality <span className="text-rose-600">*</span>
            </label>
            <AdminLocationAutoComplete
              onLocationSelect={handleLocationSelect}
              className="w-full"
            />
            <p className="text-[11px] text-stone-400">
              Search any sector, landmark, or locality (e.g. <em>Sector 62 Noida, Kalu Sarai Delhi, Laxmi Nagar</em>).
            </p>
          </div>

          {/* Selected Location Details Card */}
          {coords && validCenter && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-emerald-950 truncate">{coords.displayName}</p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Coordinates: {validCenter.lat.toFixed(4)}, {validCenter.lng.toFixed(4)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCoords(null);
                  setSummary(null);
                  setInstitutes([]);
                  setSelectedIds(new Set());
                }}
                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
                title="Change Area"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Coverage Radius & Completion Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Radius:
                </label>
                <span className="text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  {radiusKm} km radius
                </span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRadiusChange(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      radiusKm === r
                        ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/20"
                        : "bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                Target Deadline (Optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-800 focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none"
              />
            </div>
          </div>

          {/* Loading Indicator */}
          {previewing && (
            <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-bold text-stone-600 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              <span>Scanning institutes with Meilisearch geo-radius ({radiusKm} km)...</span>
            </div>
          )}

          {/* Results Summary & Interactive Mini Map Preview */}
          {summary && !previewing && coords && validCenter && (
            <div className="space-y-4 pt-2 border-t border-stone-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-center">
                  <p className="text-[10px] font-bold text-stone-400 uppercase">Found</p>
                  <p className="text-xl font-black text-stone-900 mt-0.5">{summary.total}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Free to Assign</p>
                  <p className="text-xl font-black text-emerald-900 mt-0.5">{summary.free}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
                  <p className="text-[10px] font-bold text-blue-700 uppercase">Already Yours</p>
                  <p className="text-xl font-black text-blue-900 mt-0.5">{summary.assignedToYou}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                  <p className="text-[10px] font-bold text-amber-700 uppercase">With Others</p>
                  <p className="text-xl font-black text-amber-900 mt-0.5">{summary.assignedToOther}</p>
                </div>
              </div>

              {/* 🗺️ VISUAL MINI MAP PREVIEW */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowMapPreview(!showMapPreview)}
                    className="text-xs font-bold text-stone-700 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <MapIcon className="w-3.5 h-3.5 text-rose-500" />
                    <span>{showMapPreview ? "Hide" : "Show"} Spatial Coverage Map</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMapPreview ? "rotate-180" : ""}`} />
                  </button>
                  <span className="text-[11px] text-stone-400 font-medium">
                    Radius circle ({radiusKm} km)
                  </span>
                </div>

                {showMapPreview && (
                  <div className="h-64 w-full rounded-2xl overflow-hidden border border-stone-200 shadow-inner relative">
                    <Map
                      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID"}
                      defaultCenter={{ lat: validCenter.lat, lng: validCenter.lng }}
                      defaultZoom={radiusKm <= 2 ? 14 : radiusKm <= 5 ? 13 : 12}
                      gestureHandling="greedy"
                      disableDefaultUI={true}
                      style={{ width: "100%", height: "100%" }}
                    >
                      <MiniCircleOverlay center={{ lat: validCenter.lat, lng: validCenter.lng }} radiusKm={radiusKm} />

                      {/* Center Point */}
                      <AdvancedMarker position={{ lat: validCenter.lat, lng: validCenter.lng }}>
                        <Pin background="#e11d48" borderColor="#881337" glyphColor="#ffffff" scale={1.2} />
                      </AdvancedMarker>

                      {/* Institute Pins */}
                      {validInstitutesWithCoords.map((inst) => {
                        const isFree = inst.status === "FREE";
                        const isMine = inst.status === "ASSIGNED_TO_YOU";
                        const bg = isFree ? "#10b981" : isMine ? "#0284c7" : "#f59e0b";
                        return (
                          <AdvancedMarker
                            key={inst.id}
                            position={{ lat: inst.parsedLat, lng: inst.parsedLng }}
                            title={inst.name}
                          >
                            <Pin background={bg} borderColor="#ffffff" glyphColor="#ffffff" scale={0.9} />
                          </AdvancedMarker>
                        );
                      })}
                    </Map>
                  </div>
                )}
              </div>

              {/* Reassign option */}
              {summary.assignedToOther > 0 && (
                <label className="flex items-center gap-2.5 p-3 bg-amber-50/80 border border-amber-200 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeReassign}
                    onChange={(e) => {
                      setIncludeReassign(e.target.checked);
                      if (e.target.checked) {
                        const all = new Set(selectedIds);
                        for (const i of institutes) {
                          if (i.status === "ASSIGNED_TO_OTHER") all.add(i.id);
                        }
                        setSelectedIds(all);
                      }
                    }}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-900">
                    Include {summary.assignedToOther} institute(s) already assigned to other managers (Reassign)
                  </span>
                </label>
              )}

              {/* Institute List */}
              {institutes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowList(!showList)}
                      className="text-xs font-bold text-stone-700 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-stone-500" />
                      <span>{showList ? "Hide" : "Show"} {institutes.length} Institutes in Radius</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showList ? "rotate-180" : ""}`} />
                    </button>

                    <div className="flex items-center gap-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => handleSelectAll(true)}
                        className="text-rose-600 hover:underline cursor-pointer"
                      >
                        Select All Free
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => handleSelectAll(false)}
                        className="text-stone-500 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {showList && (
                    <div className="max-h-64 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-2xl bg-white p-2">
                      {institutes.map((inst) => {
                        const isSelected = selectedIds.has(inst.id);
                        const isOther = inst.status === "ASSIGNED_TO_OTHER";
                        const isMine = inst.status === "ASSIGNED_TO_YOU";

                        return (
                          <div
                            key={inst.id}
                            className={`p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors ${
                              isSelected ? "bg-rose-50/60" : "hover:bg-stone-50"
                            }`}
                          >
                            <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isMine || (!includeReassign && isOther)}
                                onChange={() => toggleSelect(inst.id)}
                                className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-stone-800 truncate">{inst.name}</p>
                                <p className="text-[11px] text-stone-400 truncate">
                                  {inst.address || inst.city || "No address"}
                                  {inst.distanceKm !== null ? ` • ${inst.distanceKm.toFixed(1)} km away` : ""}
                                </p>
                              </div>
                            </label>

                            <div className="shrink-0">
                              {inst.status === "FREE" && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  FREE
                                </span>
                              )}
                              {isMine && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                                  ASSIGNED TO THIS SM
                                </span>
                              )}
                              {isOther && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                  WITH {inst.currentManager?.name || "OTHER"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Assign Action Button */}
              <button
                type="button"
                onClick={handleAssign}
                disabled={assigning || selectedIds.size === 0}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {assigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Assigning Area...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>Confirm Assignment ({selectedIds.size} Institutes)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
