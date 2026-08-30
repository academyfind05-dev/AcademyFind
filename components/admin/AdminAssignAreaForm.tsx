"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    MapPin, Search, Loader2, Building2, CheckCircle2, AlertTriangle, Users,
    Calendar, ChevronDown, X, ArrowRight, RefreshCcw, Info
} from "lucide-react";

interface InstitutePreview {
    id: string;
    name: string;
    address: string;
    phone: string | null;
    city: string | null;
    hasCoords: boolean;
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

const RADIUS_OPTIONS = [1, 2, 3, 5, 10];

export default function AdminAssignAreaForm({ salesManagerId }: AdminAssignAreaFormProps) {
    const router = useRouter();

    // Step 1 — Input state
    const [areaName, setAreaName] = useState("");
    const [radiusKm, setRadiusKm] = useState(3);
    const [deadline, setDeadline] = useState("");

    // Geocoding
    const [geocoding, setGeocoding] = useState(false);
    const [geocodeError, setGeocodeError] = useState("");
    const [coords, setCoords] = useState<{ lat: number; lng: number; displayName: string } | null>(null);

    // Preview
    const [previewing, setPreviewing] = useState(false);
    const [summary, setSummary] = useState<PreviewSummary | null>(null);
    const [institutes, setInstitutes] = useState<InstitutePreview[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [includeReassign, setIncludeReassign] = useState(false);
    const [showList, setShowList] = useState(false);

    // Assignment
    const [assigning, setAssigning] = useState(false);
    const [result, setResult] = useState<{ assigned: number } | null>(null);
    const [error, setError] = useState("");

    // ── Step 1: Geocode the area name ──────────────────────────────────────
    const handleGeocode = async () => {
        if (!areaName.trim()) return;
        setGeocoding(true);
        setGeocodeError("");
        setCoords(null);
        setSummary(null);
        setInstitutes([]);
        setSelectedIds(new Set());
        setResult(null);
        setError("");

        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(areaName)}&format=json&limit=1&countrycodes=in`;
            const res = await fetch(url, {
                headers: { "User-Agent": "AcademyFind Admin Panel" },
            });
            const data = await res.json();

            if (!data || data.length === 0) {
                setGeocodeError(`Could not find location: "${areaName}". Try adding a city name, e.g. "Karol Bagh, Delhi".`);
                return;
            }

            const found = data[0];
            setCoords({
                lat: parseFloat(found.lat),
                lng: parseFloat(found.lon),
                displayName: found.display_name,
            });
        } catch {
            setGeocodeError("Geocoding failed. Check your internet connection and try again.");
        } finally {
            setGeocoding(false);
        }
    };

    // ── Step 2: Preview institutes in radius ───────────────────────────────
    const handlePreview = async () => {
        if (!coords) return;
        setPreviewing(true);
        setError("");
        setResult(null);

        try {
            const params = new URLSearchParams({
                lat: String(coords.lat),
                lng: String(coords.lng),
                radius: String(radiusKm),
                salesManagerId,
                areaName: areaName.trim(),
            });
            const res = await fetch(`/api/sales/assign-area?${params}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Preview failed");
                return;
            }

            setSummary(data.summary);
            setInstitutes(data.institutes);

            // Pre-select all FREE + ASSIGNED_TO_OTHER (if includeReassign)
            const preSelected = new Set<string>();
            for (const inst of (data.institutes as InstitutePreview[])) {
                if (inst.status === "FREE") preSelected.add(inst.id);
            }
            setSelectedIds(preSelected);
        } catch {
            setError("Network error during preview.");
        } finally {
            setPreviewing(false);
        }
    };

    // Toggle reassign checkbox — update selectedIds accordingly
    const handleToggleReassign = (checked: boolean) => {
        setIncludeReassign(checked);
        setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const inst of institutes) {
                if (inst.status === "ASSIGNED_TO_OTHER") {
                    if (checked) next.add(inst.id);
                    else next.delete(inst.id);
                }
            }
            return next;
        });
    };

    // Toggle single institute
    const toggleInstitute = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // ── Step 3: Bulk assign ────────────────────────────────────────────────
    const handleAssign = async () => {
        if (selectedIds.size === 0) return;
        setAssigning(true);
        setError("");

        try {
            const res = await fetch("/api/sales/assign-area", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    salesManagerId,
                    lat: coords!.lat,
                    lng: coords!.lng,
                    radiusKm,
                    areaName: areaName.trim(),
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

            setResult({ assigned: data.assigned });
            router.refresh();
        } catch {
            setError("Network error during assignment.");
        } finally {
            setAssigning(false);
        }
    };

    // Reset everything
    const handleReset = () => {
        setAreaName("");
        setCoords(null);
        setGeocodeError("");
        setSummary(null);
        setInstitutes([]);
        setSelectedIds(new Set());
        setResult(null);
        setError("");
        setShowList(false);
    };

    const selectedFreeCount = institutes.filter(i => selectedIds.has(i.id) && i.status === "FREE").length;
    const selectedReassignCount = institutes.filter(i => selectedIds.has(i.id) && i.status === "ASSIGNED_TO_OTHER").length;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
            {/* Header */}
            <div>
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    Assign by Area
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                    Find and bulk-assign all institutes within a km radius of any location.
                </p>
            </div>

            {/* Success State */}
            {result && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-emerald-800">
                                ✅ {result.assigned} institute{result.assigned !== 1 ? "s" : ""} assigned successfully!
                            </p>
                            <p className="text-xs text-emerald-600 mt-0.5">
                                Sales manager has been notified.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleReset}
                        className="shrink-0 text-xs text-emerald-700 font-bold hover:text-emerald-900 flex items-center gap-1"
                    >
                        <RefreshCcw className="w-3 h-3" /> Assign Another Area
                    </button>
                </div>
            )}

            {!result && (
                <>
                    {/* Area Name Input + Geocode */}
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-500">
                            Area / Locality Name
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={areaName}
                                    onChange={(e) => { setAreaName(e.target.value); setCoords(null); setSummary(null); }}
                                    onKeyDown={(e) => e.key === "Enter" && handleGeocode()}
                                    placeholder="e.g. Karol Bagh, Delhi"
                                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none transition-all"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleGeocode}
                                disabled={!areaName.trim() || geocoding}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                {geocoding ? "Finding..." : "Find"}
                            </button>
                        </div>
                        {geocodeError && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <X className="w-3 h-3 shrink-0" /> {geocodeError}
                            </p>
                        )}
                        {coords && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-medium truncate">{coords.displayName}</span>
                            </div>
                        )}
                    </div>

                    {/* Radius + Deadline */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                Radius
                            </label>
                            <div className="flex gap-1 flex-wrap">
                                {RADIUS_OPTIONS.map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => { setRadiusKm(r); setSummary(null); setInstitutes([]); }}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                            radiusKm === r
                                                ? "bg-rose-600 border-rose-700 text-white shadow-sm"
                                                : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                                        }`}
                                    >
                                        {r} km
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> Deadline (optional)
                            </label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Preview Button */}
                    {coords && !summary && (
                        <button
                            type="button"
                            onClick={handlePreview}
                            disabled={previewing}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-all"
                        >
                            {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            {previewing ? "Searching institutes..." : `Preview institutes within ${radiusKm} km`}
                        </button>
                    )}

                    {/* ── Preview Results ── */}
                    {summary && (
                        <div className="space-y-4">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-extrabold text-slate-800">{summary.total}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">Total Found</p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-extrabold text-emerald-700">{summary.free}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold mt-0.5">Unassigned</p>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-extrabold text-amber-700">{summary.assignedToOther}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-amber-600 font-bold mt-0.5">Other Mgr</p>
                                </div>
                            </div>

                            {summary.assignedToYou > 0 && (
                                <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg">
                                    <Info className="w-3.5 h-3.5 shrink-0" />
                                    {summary.assignedToYou} institute{summary.assignedToYou !== 1 ? "s are" : " is"} already assigned to this manager and will be skipped.
                                </div>
                            )}

                            {/* Reassign Toggle */}
                            {summary.assignedToOther > 0 && (
                                <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={includeReassign}
                                        onChange={(e) => handleToggleReassign(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded accent-amber-600"
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-amber-800">
                                            Also reassign {summary.assignedToOther} institute{summary.assignedToOther !== 1 ? "s" : ""} currently with other managers
                                        </p>
                                        <p className="text-[11px] text-amber-600 mt-0.5">
                                            These will be transferred to this sales manager.
                                        </p>
                                    </div>
                                </label>
                            )}

                            {/* Toggle list */}
                            {institutes.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowList((p) => !p)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    <span>{showList ? "Hide" : "Show"} institute list ({institutes.length})</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showList ? "rotate-180" : ""}`} />
                                </button>
                            )}

                            {/* Scrollable Institute List */}
                            {showList && (
                                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                                    {institutes.map((inst) => {
                                        const isSelected = selectedIds.has(inst.id);
                                        const isSkipped = inst.status === "ASSIGNED_TO_YOU";
                                        return (
                                            <div
                                                key={inst.id}
                                                onClick={() => !isSkipped && toggleInstitute(inst.id)}
                                                className={`flex items-start gap-3 p-3 transition-colors ${
                                                    isSkipped
                                                        ? "opacity-50 cursor-not-allowed bg-slate-50"
                                                        : "cursor-pointer hover:bg-slate-50"
                                                }`}
                                            >
                                                {!isSkipped && (
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        readOnly
                                                        className="mt-0.5 w-4 h-4 rounded accent-rose-600 shrink-0"
                                                    />
                                                )}
                                                {isSkipped && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 truncate">{inst.name}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{inst.address}</p>
                                                    {inst.distanceKm !== null && (
                                                        <span className="text-[10px] text-slate-400">{inst.distanceKm} km away</span>
                                                    )}
                                                </div>
                                                <div className="shrink-0">
                                                    {inst.status === "FREE" && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">Free</span>
                                                    )}
                                                    {inst.status === "ASSIGNED_TO_YOU" && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">Already Yours</span>
                                                    )}
                                                    {inst.status === "ASSIGNED_TO_OTHER" && (
                                                        <div className="text-right">
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                                <Users className="w-2.5 h-2.5" />
                                                                {inst.currentManager?.name || "Other Mgr"}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Assign Button */}
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleAssign}
                                    disabled={assigning || selectedIds.size === 0}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    {assigning ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-4 h-4" />
                                    )}
                                    {assigning
                                        ? "Assigning..."
                                        : `Assign ${selectedIds.size} Institute${selectedIds.size !== 1 ? "s" : ""}`}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-3 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                                    title="Reset"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {selectedIds.size > 0 && (
                                <p className="text-[11px] text-slate-400 text-center -mt-2">
                                    {selectedFreeCount > 0 && `${selectedFreeCount} new`}
                                    {selectedFreeCount > 0 && selectedReassignCount > 0 && " + "}
                                    {selectedReassignCount > 0 && `${selectedReassignCount} transfer from other managers`}
                                </p>
                            )}

                            {error && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                                </p>
                            )}
                        </div>
                    )}

                    {error && !summary && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
