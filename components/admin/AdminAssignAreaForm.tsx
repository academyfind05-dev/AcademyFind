"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    MapPin, Search, Loader2, Building2, CheckCircle2, AlertTriangle, Users,
    Calendar, ChevronDown, X, ArrowRight, RefreshCcw, Info, Sparkles
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

interface LocationSuggestion {
    description: string;
    place_id: string;
    lat: number;
    lng: number;
    structured_formatting?: {
        main_text: string;
        secondary_text: string;
    };
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

    // Autocomplete Suggestions State
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionsRef = useRef<HTMLDivElement>(null);

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

    // ── Live Autocomplete Suggestions Fetch ──────────────────────────────
    useEffect(() => {
        if (!areaName || areaName.trim().length < 2) {
            setSuggestions([]);
            setIsSearchingSuggestions(false);
            return;
        }

        // If user already selected this exact location, don't re-search
        if (coords && coords.displayName === areaName) {
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingSuggestions(true);
            try {
                const res = await fetch(`/api/mobile/location/autocomplete?input=${encodeURIComponent(areaName.trim())}`);
                if (res.ok) {
                    const data = await res.json();
                    const preds = data.predictions || [];
                    setSuggestions(preds);
                    setShowSuggestions(preds.length > 0);
                }
            } catch (err) {
                console.error("Location suggestions error:", err);
            } finally {
                setIsSearchingSuggestions(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [areaName, coords]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ── When user clicks a suggestion ──────────────────────────────────────
    const handleSelectSuggestion = (sug: LocationSuggestion) => {
        setAreaName(sug.description);
        setShowSuggestions(false);
        setSuggestions([]);
        setGeocodeError("");
        const newCoords = {
            lat: sug.lat,
            lng: sug.lng,
            displayName: sug.description,
        };
        setCoords(newCoords);
        fetchPreviewForCoords(newCoords.lat, newCoords.lng, sug.description);
    };

    // ── Helper to preview institutes for specific coords ───────────────────
    const fetchPreviewForCoords = async (lat: number, lng: number, name: string) => {
        setPreviewing(true);
        setError("");
        setResult(null);

        try {
            const params = new URLSearchParams({
                lat: String(lat),
                lng: String(lng),
                radius: String(radiusKm),
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
            setInstitutes(data.institutes);

            // Pre-select all FREE
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

    // ── Manual Geocode Fallback (if user hits Enter/Find) ──────────────────
    const handleGeocode = async () => {
        if (!areaName.trim()) return;
        setShowSuggestions(false);
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
            const newCoords = {
                lat: parseFloat(found.lat),
                lng: parseFloat(found.lon),
                displayName: found.display_name,
            };
            setCoords(newCoords);
            fetchPreviewForCoords(newCoords.lat, newCoords.lng, areaName);
        } catch {
            setGeocodeError("Geocoding failed. Check your internet connection and try again.");
        } finally {
            setGeocoding(false);
        }
    };

    // ── Preview on Radius change if coords already known ──────────────────
    const handleRadiusChange = (newRadius: number) => {
        setRadiusKm(newRadius);
        if (coords) {
            fetchPreviewForCoords(coords.lat, coords.lng, areaName);
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
            setError("Network error. Could not complete assignment.");
        } finally {
            setAssigning(false);
        }
    };

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
        setSuggestions([]);
        setShowSuggestions(false);
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
                    Search any locality, sector or area name to get instant suggestions and bulk-assign institutes in radius.
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
                    {/* Area Name Input + Dynamic Autocomplete Suggestions */}
                    <div className="space-y-2 relative" ref={suggestionsRef}>
                        <label className="block text-xs font-semibold text-slate-500">
                            Area / Locality Name
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={areaName}
                                    onChange={(e) => {
                                        setAreaName(e.target.value);
                                        setCoords(null);
                                        setSummary(null);
                                    }}
                                    onFocus={() => {
                                        if (suggestions.length > 0) setShowSuggestions(true);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            if (showSuggestions && suggestions.length > 0) {
                                                handleSelectSuggestion(suggestions[0]);
                                            } else {
                                                handleGeocode();
                                            }
                                        }
                                    }}
                                    placeholder="Search area (e.g. Sector 62 Noida, Karol Bagh, Laxmi Nagar)..."
                                    className="w-full pl-8 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none transition-all"
                                />
                                {isSearchingSuggestions && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleGeocode}
                                disabled={!areaName.trim() || geocoding}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                                {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                {geocoding ? "Finding..." : "Find"}
                            </button>
                        </div>

                        {/* 🚀 Floating Autocomplete Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-50 left-0 right-0 top-[68px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="p-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                    <span>Location Suggestions</span>
                                    <span className="text-[9px] text-slate-400">Click to select</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {suggestions.map((sug, idx) => (
                                        <button
                                            key={sug.place_id || idx}
                                            type="button"
                                            onClick={() => handleSelectSuggestion(sug)}
                                            className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50/60 transition-colors flex items-start gap-2.5 group cursor-pointer"
                                        >
                                            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors mt-0.5 shrink-0">
                                                <MapPin className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-slate-800 group-hover:text-rose-900 transition-colors truncate">
                                                    {sug.structured_formatting?.main_text || sug.description.split(",")[0]}
                                                </p>
                                                <p className="text-[11px] text-slate-400 group-hover:text-rose-700/80 transition-colors truncate">
                                                    {sug.structured_formatting?.secondary_text || sug.description}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

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
                                        onClick={() => handleRadiusChange(r)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
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
                                min={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none"
                            />
                        </div>
                    </div>

                    {/* Preview Loading */}
                    {previewing && (
                        <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                            <span>Scanning institutes in {radiusKm} km radius...</span>
                        </div>
                    )}

                    {/* Preview Results Summary */}
                    {summary && !previewing && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-2">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                                    <p className="text-lg font-extrabold text-slate-800">{summary.total}</p>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Found</p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-center">
                                    <p className="text-lg font-extrabold text-emerald-700">{summary.free}</p>
                                    <p className="text-[10px] font-semibold text-emerald-600 uppercase">Free</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-center">
                                    <p className="text-lg font-extrabold text-blue-700">{summary.assignedToYou}</p>
                                    <p className="text-[10px] font-semibold text-blue-500 uppercase">Already Assigned</p>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-center">
                                    <p className="text-lg font-extrabold text-amber-700">{summary.assignedToOther}</p>
                                    <p className="text-[10px] font-semibold text-amber-600 uppercase">Other Manager</p>
                                </div>
                            </div>

                            {/* Reassign toggle if other managers have institutes */}
                            {summary.assignedToOther > 0 && (
                                <label className="flex items-start gap-2.5 p-3 bg-amber-50/70 border border-amber-200 rounded-xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeReassign}
                                        onChange={(e) => handleToggleReassign(e.target.checked)}
                                        className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <div className="text-xs">
                                        <span className="font-bold text-amber-900">
                                            Also reassign {summary.assignedToOther} institute{summary.assignedToOther !== 1 ? "s" : ""} from other managers
                                        </span>
                                        <p className="text-amber-700 mt-0.5">
                                            Their active deadlines will be updated to the new manager.
                                        </p>
                                    </div>
                                </label>
                            )}

                            {/* View / Select Institutes toggle */}
                            <button
                                type="button"
                                onClick={() => setShowList(!showList)}
                                className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                    {showList ? "Hide" : "Review & Select"} {institutes.length} Institutes ({selectedIds.size} selected)
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showList ? "rotate-180" : ""}`} />
                            </button>

                            {/* Institutes Selection List */}
                            {showList && (
                                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                                    {institutes.map((inst) => {
                                        const isSelected = selectedIds.has(inst.id);
                                        const isYou = inst.status === "ASSIGNED_TO_YOU";
                                        return (
                                            <div
                                                key={inst.id}
                                                onClick={() => !isYou && toggleInstitute(inst.id)}
                                                className={`flex items-start justify-between gap-2 p-2.5 rounded-lg border text-xs transition-all ${
                                                    isYou
                                                        ? "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"
                                                        : isSelected
                                                        ? "bg-white border-rose-200 shadow-xs cursor-pointer"
                                                        : "bg-white border-slate-100 hover:border-slate-200 cursor-pointer"
                                                }`}
                                            >
                                                <div className="flex items-start gap-2 min-w-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        disabled={isYou}
                                                        onChange={() => {}}
                                                        className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-800 truncate">{inst.name}</p>
                                                        <p className="text-[11px] text-slate-400 truncate">{inst.address || inst.city || "No address"}</p>
                                                        {inst.distanceKm !== null && (
                                                            <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
                                                                📍 {inst.distanceKm} km away
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`shrink-0 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                                                    inst.status === "FREE"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : inst.status === "ASSIGNED_TO_YOU"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-amber-100 text-amber-700"
                                                }`}>
                                                    {inst.status === "FREE" ? "Free" : inst.status === "ASSIGNED_TO_YOU" ? "Assigned" : inst.currentManager?.name || "Other"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Assignment Summary Bar + Action Button */}
                            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="text-xs text-slate-500">
                                    <span className="font-bold text-slate-800">{selectedIds.size}</span> institute{selectedIds.size !== 1 ? "s" : ""} selected for assignment
                                    {selectedReassignCount > 0 && (
                                        <span className="text-amber-600 ml-1">({selectedReassignCount} reassign)</span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAssign}
                                    disabled={selectedIds.size === 0 || assigning}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer"
                                >
                                    {assigning ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Assigning...
                                        </>
                                    ) : (
                                        <>
                                            <span>Assign {selectedIds.size} Institutes</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-xs text-red-500 flex items-center gap-1 bg-red-50 p-2.5 rounded-xl border border-red-100">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
