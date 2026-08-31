"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  MapPin,
  Phone,
  Mail,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Route,
  Filter,
  Plus,
  Trash2,
  Sparkles,
  Building2,
  CalendarDays,
  Layers,
  ChevronRight,
  X,
  Edit3,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";
import SalesStatusUpdateForm from "@/components/sales/SalesStatusUpdateForm";
import { SalesStatusBadge } from "@/components/sales/SalesStatusBadge";
import { formatIST } from "@/lib/utils";

export interface TerritoryInstitute {
  assignmentId: string;
  instituteId: string;
  name: string;
  slug?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  category?: string | null;
  latitude: number | null;
  longitude: number | null;
  contactStatus: string;
  interest?: string | null;
  remark?: string | null;
  onboardedPlan?: string | null;
  deadline?: string | Date | null;
  areaAssignmentId?: string | null;
  areaName?: string | null;
}

export interface TerritoryArea {
  id: string;
  areaName: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  deadline?: string | Date | null;
}

interface SalesTerritoryMapProps {
  institutes: TerritoryInstitute[];
  areas?: TerritoryArea[];
  salesManagerName?: string;
  className?: string;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  NOT_CONTACTED: { bg: "#f43f5e", border: "#9f1239", text: "#ffffff", label: "Not Contacted" },
  CONTACTED: { bg: "#f59e0b", border: "#b45309", text: "#ffffff", label: "Contacted" },
  IN_PROCESS: { bg: "#0284c7", border: "#0369a1", text: "#ffffff", label: "In Process" },
  ONBOARDED: { bg: "#10b981", border: "#047857", text: "#ffffff", label: "Onboarded" },
  UPGRADED: { bg: "#8b5cf6", border: "#6d28d9", text: "#ffffff", label: "Upgraded 🚀" },
};

// ── Helper Component to Draw Territory Radius Circles ─────────────────────────
function TerritoryCircleOverlay({ areas }: { areas: TerritoryArea[] }) {
  const map = useMap();
  const circlesRef = useRef<google.maps.Circle[]>([]);

  useEffect(() => {
    if (!map || typeof window === "undefined" || !window.google?.maps) return;

    // Clear old circles
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    // Create new circles
    areas.forEach((a) => {
      if (!a.latitude || !a.longitude) return;
      const circle = new google.maps.Circle({
        map,
        center: { lat: a.latitude, lng: a.longitude },
        radius: a.radiusKm * 1000,
        fillColor: "#0284c7",
        fillOpacity: 0.12,
        strokeColor: "#0284c7",
        strokeOpacity: 0.7,
        strokeWeight: 2,
      });
      circlesRef.current.push(circle);
    });

    return () => {
      circlesRef.current.forEach((c) => c.setMap(null));
      circlesRef.current = [];
    };
  }, [map, areas]);

  return null;
}

export default function SalesTerritoryMap({
  institutes,
  areas = [],
  salesManagerName,
  className = "h-[650px]",
}: SalesTerritoryMapProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedInstitute, setSelectedInstitute] = useState<TerritoryInstitute | null>(null);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  // Field Route Planner State (List of institute IDs in planned visit sequence)
  const [routePlan, setRoutePlan] = useState<TerritoryInstitute[]>([]);
  const [isRouteDrawerOpen, setIsRouteDrawerOpen] = useState(false);

  // Filter institutes with valid coordinates
  const validInstitutes = useMemo(() => {
    return institutes.filter((inst) => inst.latitude !== null && inst.longitude !== null);
  }, [institutes]);

  // Apply Area and Status Filters
  const filteredInstitutes = useMemo(() => {
    return validInstitutes.filter((inst) => {
      if (selectedAreaId !== "ALL" && inst.areaAssignmentId !== selectedAreaId) {
        return false;
      }
      if (selectedStatus !== "ALL" && inst.contactStatus !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [validInstitutes, selectedAreaId, selectedStatus]);

  // Active Territory Areas for Circle overlay
  const activeAreas = useMemo(() => {
    if (selectedAreaId === "ALL") return areas;
    return areas.filter((a) => a.id === selectedAreaId);
  }, [areas, selectedAreaId]);

  // Determine initial center
  const defaultCenter = useMemo(() => {
    if (filteredInstitutes.length > 0) {
      return {
        lat: filteredInstitutes[0].latitude!,
        lng: filteredInstitutes[0].longitude!,
      };
    }
    if (areas.length > 0 && areas[0].latitude && areas[0].longitude) {
      return {
        lat: areas[0].latitude,
        lng: areas[0].longitude,
      };
    }
    return { lat: 28.6139, lng: 77.209 }; // Delhi Default
  }, [filteredInstitutes, areas]);

  // Add / Remove from Today's Route Plan
  const toggleRouteItem = (inst: TerritoryInstitute) => {
    const exists = routePlan.some((r) => r.assignmentId === inst.assignmentId);
    if (exists) {
      setRoutePlan(routePlan.filter((r) => r.assignmentId !== inst.assignmentId));
    } else {
      setRoutePlan([...routePlan, inst]);
      setIsRouteDrawerOpen(true);
    }
  };

  // Launch Multi-Stop Google Maps Navigation Route
  const handleStartGoogleMapsRoute = () => {
    if (routePlan.length === 0) return;

    if (routePlan.length === 1) {
      const dest = routePlan[0];
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}`,
        "_blank"
      );
      return;
    }

    const destination = routePlan[routePlan.length - 1];
    const waypoints = routePlan
      .slice(0, routePlan.length - 1)
      .map((item) => `${item.latitude},${item.longitude}`)
      .join("|");

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&waypoints=${encodeURIComponent(
      waypoints
    )}`;
    window.open(url, "_blank");
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-stone-200 shadow-md bg-white">
      {/* ── TOP CONTROL BAR ── */}
      <div className="p-4 bg-white/95 backdrop-blur-md border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex flex-wrap items-center gap-2">
          {/* Territory Area Selector */}
          {areas.length > 0 && (
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-2xl">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="bg-transparent text-xs font-bold text-stone-800 outline-none cursor-pointer pr-1"
              >
                <option value="ALL">All Territories ({areas.length} Areas)</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    📍 {a.areaName} ({a.radiusKm} km)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-2xl">
            <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-800 outline-none cursor-pointer pr-1"
            >
              <option value="ALL">All Statuses ({validInstitutes.length})</option>
              <option value="NOT_CONTACTED">🔴 Not Contacted</option>
              <option value="CONTACTED">🟡 Contacted</option>
              <option value="IN_PROCESS">🔵 In Process</option>
              <option value="ONBOARDED">🟢 Onboarded</option>
              <option value="UPGRADED">🚀 Upgraded</option>
            </select>
          </div>
        </div>

        {/* Route Planner Trigger Button */}
        <button
          type="button"
          onClick={() => setIsRouteDrawerOpen(!isRouteDrawerOpen)}
          className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            routePlan.length > 0
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          <Route className="w-3.5 h-3.5 text-amber-400" />
          <span>Today's Visit Route</span>
          {routePlan.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center text-[10px] font-black">
              {routePlan.length}
            </span>
          )}
        </button>
      </div>

      {/* ── MAP CONTAINER ── */}
      <div className={`relative w-full ${className}`}>
        {validInstitutes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-stone-50 text-stone-400 text-center">
            <Building2 className="w-12 h-12 mb-2 text-stone-300" />
            <p className="font-bold text-sm text-stone-600">No Geocoded Institutes in this Territory</p>
            <p className="text-xs text-stone-400 mt-1 max-w-sm">
              Institutes must have latitude and longitude coordinates to be displayed on the map.
            </p>
          </div>
        ) : (
          <Map
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID"}
            defaultCenter={defaultCenter}
            defaultZoom={13}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: "100%", height: "100%" }}
          >
            {/* Draw Radius Circles */}
            <TerritoryCircleOverlay areas={activeAreas} />

            {/* Plotted Institute Markers */}
            {filteredInstitutes.map((inst) => {
              const statusCfg = STATUS_COLORS[inst.contactStatus] || STATUS_COLORS.NOT_CONTACTED;
              const routeIndex = routePlan.findIndex((r) => r.assignmentId === inst.assignmentId);
              const isPlanned = routeIndex !== -1;

              return (
                <AdvancedMarker
                  key={inst.assignmentId}
                  position={{ lat: inst.latitude!, lng: inst.longitude! }}
                  onClick={() => {
                    setSelectedInstitute(inst);
                    setShowStatusUpdate(false);
                  }}
                >
                  <div className="relative cursor-pointer transition-transform hover:scale-125">
                    <Pin
                      background={isPlanned ? "#0f172a" : statusCfg.bg}
                      borderColor={isPlanned ? "#f59e0b" : statusCfg.border}
                      glyphColor="#ffffff"
                      scale={isPlanned ? 1.3 : 1.1}
                    />
                    {isPlanned && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md">
                        {routeIndex + 1}
                      </span>
                    )}
                  </div>
                </AdvancedMarker>
              );
            })}
          </Map>
        )}

        {/* ── SELECTED INSTITUTE FLYOUT / DRAWER ── */}
        {selectedInstitute && (
          <div className="absolute left-4 top-4 bottom-4 w-80 sm:w-96 bg-white/98 backdrop-blur-md border border-stone-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-20 animate-in fade-in slide-in-from-left-4 duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-100 flex items-start justify-between gap-3 bg-stone-50/70">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <SalesStatusBadge status={selectedInstitute.contactStatus} />
                  {selectedInstitute.areaName && (
                    <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                      📍 {selectedInstitute.areaName}
                    </span>
                  )}
                </div>
                <h4 className="font-black text-stone-900 text-base mt-1.5 leading-snug truncate">
                  {selectedInstitute.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInstitute(null)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-xl hover:bg-stone-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3.5 text-xs text-stone-600">
              {/* Address */}
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-stone-800 font-medium leading-relaxed">
                    {selectedInstitute.address || selectedInstitute.city || "Address not specified"}
                  </p>
                  {selectedInstitute.category && (
                    <span className="inline-block mt-1 bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded text-[10px]">
                      {selectedInstitute.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Deadline & Remark */}
              {selectedInstitute.deadline && (
                <div className="flex items-center gap-2 text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100 font-medium">
                  <CalendarDays className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>Target: {formatIST(selectedInstitute.deadline, "MMM dd, yyyy")}</span>
                </div>
              )}

              {selectedInstitute.remark && (
                <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-2.5 text-amber-900 text-[11px] leading-relaxed">
                  <span className="font-bold">Last Remark:</span> {selectedInstitute.remark}
                </div>
              )}

              {/* ── ACTION BUTTONS ── */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="grid grid-cols-2 gap-2">
                  {/* WhatsApp */}
                  {selectedInstitute.phone ? (
                    <a
                      href={`https://wa.me/${selectedInstitute.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Hi, I am reaching out from AcademyFind regarding ${selectedInstitute.name}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>
                  ) : null}

                  {/* Call */}
                  {selectedInstitute.phone ? (
                    <a
                      href={`tel:${selectedInstitute.phone}`}
                      className="py-2.5 px-3 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </a>
                  ) : null}
                </div>

                {/* Google Maps Directions */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedInstitute.latitude},${selectedInstitute.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate in Google Maps</span>
                </a>

                {/* Add to Route Plan Button */}
                <button
                  type="button"
                  onClick={() => toggleRouteItem(selectedInstitute)}
                  className={`w-full py-2.5 px-3 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    routePlan.some((r) => r.assignmentId === selectedInstitute.assignmentId)
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-slate-900 hover:bg-black text-white"
                  }`}
                >
                  <Route className="w-3.5 h-3.5" />
                  <span>
                    {routePlan.some((r) => r.assignmentId === selectedInstitute.assignmentId)
                      ? "✓ Added in Today's Visit Plan"
                      : "+ Add to Today's Visit Route"}
                  </span>
                </button>

                {/* Quick Status Update Toggle */}
                <button
                  type="button"
                  onClick={() => setShowStatusUpdate(!showStatusUpdate)}
                  className="w-full py-2 px-3 text-stone-600 hover:text-stone-900 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{showStatusUpdate ? "Hide Status Form" : "Update Status & Note"}</span>
                </button>
              </div>

              {/* Status Update Form Modal Inside Drawer */}
              {showStatusUpdate && (
                <div className="pt-2 border-t border-stone-100">
                  <SalesStatusUpdateForm
                    assignmentId={selectedInstitute.assignmentId}
                    currentStatus={selectedInstitute.contactStatus}
                    currentInterest={selectedInstitute.interest || null}
                    currentRemark={selectedInstitute.remark || null}
                    currentPlan={selectedInstitute.onboardedPlan || null}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ROUTE PLANNER RIGHT FLYOUT ── */}
        {isRouteDrawerOpen && (
          <div className="absolute right-4 top-4 bottom-4 w-80 sm:w-96 bg-slate-950/95 text-white backdrop-blur-lg border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-20 animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Route className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Today's Field Route</h4>
                  <p className="text-[11px] text-slate-400">{routePlan.length} stops planned</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRouteDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stops List */}
            <div className="p-3 overflow-y-auto flex-1 divide-y divide-slate-800/80 space-y-2">
              {routePlan.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <p>No stops added yet.</p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Click any marker on the map and tap "+ Add to Today's Visit Route".
                  </p>
                </div>
              ) : (
                routePlan.map((item, idx) => (
                  <div key={item.assignmentId} className="pt-2 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.address || item.city || "—"}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRouteItem(item)}
                      className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                      title="Remove Stop"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Multi-Stop Start Navigation */}
            {routePlan.length > 0 && (
              <div className="p-4 border-t border-slate-800 bg-slate-900/60 space-y-2">
                <button
                  type="button"
                  onClick={handleStartGoogleMapsRoute}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-2xl font-black text-xs shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Start Multi-Stop Navigation ({routePlan.length} Stops)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoutePlan([])}
                  className="w-full py-1.5 text-center text-[11px] font-bold text-slate-500 hover:text-slate-300"
                >
                  Clear Route
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
