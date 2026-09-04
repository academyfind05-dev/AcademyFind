"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  ArrowDownUp, MapPin, Star, IndianRupee, Navigation, 
  Loader2, MonitorSmartphone, Filter, Sparkles, UserCircle 
} from "lucide-react";
import { Button } from "../ui/button";

interface Props {
  category: string;
  city: string;
  hasLocation: boolean;
}

export default function CityFilters({ category, city, hasLocation }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLocating, setIsLocating] = useState(false);

  const currentSort = searchParams.get("sort") || "reviews";
  const currentRadius = searchParams.get("radius") || "5";
  const currentRating = searchParams.get("rating") || "all";
  const currentFee = searchParams.get("fee") || "all";
  const currentMode= searchParams.get("mode");
  const currentProviderType = searchParams.get("providerType") || "ALL";

  const currentModes = currentMode ? currentMode.split(",") : ["offline", "online", "hybrid"];
  
  const isClosest = searchParams.get("closest") === "true";
  const isClosestUser = searchParams.get("closestUser") === "true";

  const toggleClosest = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isClosest) {
      params.delete("closest");
    } else {
      params.delete("sort");
      params.delete("closestUser");
      params.delete("userLat");
      params.delete("userLng");
      params.set("closest", "true");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleClosestToMe = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (isClosestUser) {
      params.delete("closestUser");
      params.delete("userLat");
      params.delete("userLng");
      router.push(`${pathname}?${params.toString()}`);
      return;
    }

    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          params.delete("sort");
          params.delete("closest");
          params.set("closestUser", "true");
          params.set("userLat", position.coords.latitude.toString());
          params.set("userLng", position.coords.longitude.toString());
          
          router.push(`${pathname}?${params.toString()}`);
          setIsLocating(false);
        },
        (error) => {
          console.error(error);
          alert("We couldn't fetch your location. Please allow location access in your browser.");
          setIsLocating(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (key === "sort") {
      params.delete("closest");
      params.delete("closestUser");
      params.delete("userLat");
      params.delete("userLng");
    }

    if (key === "sort" && value === "reviews") {
      params.delete(key);
    } else if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleMode = (modeValue: string) => {
    let newModes = [...currentModes];
    
    if (newModes.includes(modeValue)) {
      newModes = newModes.filter((m) => m !== modeValue);
    } else {
      newModes.push(modeValue);
    }

    const params = new URLSearchParams(searchParams.toString());

    if (newModes.length === 3 || newModes.length === 0) {
      params.delete("mode");
    } else {
      params.set("mode", newModes.join(","));
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const triggerClasses = "!w-full w-full flex items-center justify-between px-4 rounded-full border border-amber-200 bg-white hover:bg-amber-50 focus:ring-2 focus:ring-amber-400 focus:ring-offset-0 focus:outline-none transition-all data-[state=open]:bg-amber-50 data-[state=open]:border-amber-400 h-11 shadow-sm text-sm";

  // 🔥 Quick Filters (Dropdowns)
  const renderQuickFilters = () => (
    <>
      <Select value={currentSort} onValueChange={(val) => handleFilterChange("sort", val)}>
        <SelectTrigger className={triggerClasses}>
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <ArrowDownUp className="h-4 w-4 text-amber-400" />
            <SelectValue placeholder="Sort By" />
          </div>
        </SelectTrigger>
        {/* 🔥 Fixed Z-Index: z-[200] so it opens OVER other elements */}
        <SelectContent className="rounded-xl border-slate-100 shadow-xl z-[200]" position="popper" side="bottom" sideOffset={5}>
          <SelectItem value="relevance" className="cursor-pointer">Relevance</SelectItem>
          <SelectItem value="rating" className="cursor-pointer">Top Rated</SelectItem>
          <SelectItem value="reviews" className="cursor-pointer">Most Reviewed</SelectItem>
        </SelectContent>
      </Select>

      {hasLocation && (
        <Select value={currentRadius} onValueChange={(val) => handleFilterChange("radius", val)}>
          <SelectTrigger className={triggerClasses}>
            <div className="flex items-center gap-2 font-medium text-slate-700">
              <MapPin className="h-4 w-4 text-amber-400" />
              <SelectValue placeholder="Distance" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-100 shadow-xl z-[200]" position="popper" side="bottom" sideOffset={5}>
            <SelectItem value="2" className="cursor-pointer">Within 2 km</SelectItem>
            <SelectItem value="5" className="cursor-pointer">Within 5 km</SelectItem>
            <SelectItem value="10" className="cursor-pointer">Within 10 km</SelectItem>
            <SelectItem value="20" className="cursor-pointer">Within 20 km</SelectItem>
          </SelectContent>
        </Select>
      )}

      <Select value={currentRating} onValueChange={(val) => handleFilterChange("rating", val)}>
        <SelectTrigger className={triggerClasses}>
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <Star className="h-4 w-4 text-amber-400" />
            <SelectValue placeholder="Ratings" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-100 shadow-xl z-[200]" position="popper" side="bottom" sideOffset={5}>
          <SelectItem value="all" className="cursor-pointer">Any Rating</SelectItem>
          <SelectItem value="4.5" className="cursor-pointer">4.5+ Stars</SelectItem>
          <SelectItem value="4.0" className="cursor-pointer">4.0+ Stars</SelectItem>
          <SelectItem value="3.5" className="cursor-pointer">3.5+ Stars</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currentProviderType} onValueChange={(val) => handleFilterChange("providerType", val)}>
        <SelectTrigger className={triggerClasses}>
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <UserCircle className="h-4 w-4 text-amber-400" />
            <SelectValue placeholder="Institute / Mentor" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-100 shadow-xl z-[200]" position="popper" side="bottom" sideOffset={5}>
          <SelectItem value="ALL" className="cursor-pointer">All Institutes & Tutors</SelectItem>
          <SelectItem value="INSTITUTE" className="cursor-pointer">Coaching Institutes</SelectItem>
          <SelectItem value="INDIVIDUAL" className="cursor-pointer">Individual Tutors</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  // 🔥 Detailed Filters (Modes, Checkboxes, Actions)
  const renderDetailedFilters = () => (
    <>
      <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm mt-1">
        <div className="flex items-center gap-2 font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
          <MonitorSmartphone className="h-5 w-5 text-amber-400" />
          <span>Learning Mode</span>
        </div>
        <div className="flex flex-col gap-3.5">
          {[
            { id: "offline", label: "Offline / Classroom" },
            { id: "online", label: "Online / Live Classes" },
            { id: "hybrid", label: "Hybrid Mode" },
            { id: "hometuition", label: "Home Tuition" },
          ].map((mode) => (
            <div key={mode.id} className="flex items-center space-x-3 group">
              <Checkbox
                id={`mode-${mode.id}`}
                checked={currentModes.includes(mode.id)}
                onCheckedChange={() => toggleMode(mode.id)}
                className="h-5 w-5 rounded-[6px] border-slate-300 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-500 transition-all cursor-pointer"
              />
              <Label
                htmlFor={`mode-${mode.id}`}
                className="cursor-pointer text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors flex-1"
              >
                {mode.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-1">
        {hasLocation && (
          <Button 
            variant="outline"
            onClick={toggleClosest}
            className={`w-full h-auto py-3 px-4 flex items-start justify-start rounded-2xl transition-all ${
              isClosest 
                ? "bg-amber-500 text-white hover:bg-amber-600 border-amber-500" 
                : "bg-white border-amber-200 text-slate-700 hover:bg-amber-50"
            }`}
          >
            <MapPin className="mr-3 h-4 w-4 shrink-0 mt-0.5" />
            <span className="flex-1 whitespace-normal text-left leading-relaxed text-xs font-bold break-words">
              {isClosest ? "Sorted: Closest from selected location" : "Sort by Closest from selected location"}
            </span>
          </Button>
        )}

        <Button 
          variant="outline"
          onClick={toggleClosestToMe}
          disabled={isLocating}
          className={`w-full h-auto py-3 px-4 flex items-start justify-start rounded-2xl transition-all ${
            isClosestUser 
              ? "bg-amber-500 text-white hover:bg-amber-600 border-amber-500" 
              : "bg-white border-amber-200 text-slate-700 hover:bg-amber-50"
          }`}
        >
          {isLocating ? (
            <Loader2 className="mr-3 h-4 w-4 animate-spin shrink-0 mt-0.5" />
          ) : (
            <Navigation className="mr-3 h-4 w-4 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 whitespace-normal text-left leading-relaxed text-xs font-bold break-words">
            {isClosestUser ? "Sorted: Closest to Me" : "Sort by Closest to Me"}
          </span>
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-4 mb-8">
      {renderQuickFilters()}
      {renderDetailedFilters()}
    </div>
  );
}