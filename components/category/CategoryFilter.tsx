"use client";

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
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Star, IndianRupee, MonitorSmartphone, Filter, Sparkles, UserCircle } from "lucide-react";

interface Props {
  category: string;
}

export default function CategoryFilters({ category }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "reviews";
  const currentRating = searchParams.get("rating") || "all";
  const currentFee = searchParams.get("fee") || "all";
  const currentProviderType = searchParams.get("providerType") || "ALL";
  
  const currentModeParam = searchParams.get("mode");
  const currentModes = currentModeParam ? currentModeParam.split(",") : ["offline", "online", "hybrid"];

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (key === "sort" && value === "reviews") {
      params.delete(key);
    } else if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); 
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
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const triggerClasses = "!w-full w-full flex items-center justify-between px-4 rounded-full border border-amber-200 bg-white hover:bg-amber-50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0 focus:outline-none transition-all data-[state=open]:bg-amber-50 data-[state=open]:border-amber-500 h-11 shadow-sm text-sm";

  // 🔥 Quick Filters (Dropdowns)
  const renderQuickFilters = () => (
    <>
      <Select value={currentSort} onValueChange={(val) => handleFilterChange("sort", val)}>
        <SelectTrigger className={triggerClasses}>
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <ArrowDownUp className="h-4 w-4 text-amber-500" />
            <SelectValue placeholder="Sort By" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-100 shadow-xl z-[200]" position="popper" side="bottom" sideOffset={5}>
          <SelectItem value="relevance" className="cursor-pointer">Relevance</SelectItem>
          <SelectItem value="rating" className="cursor-pointer">Top Rated</SelectItem>
          <SelectItem value="reviews" className="cursor-pointer">Most Reviewed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currentProviderType} onValueChange={(val) => handleFilterChange("providerType", val)}>
        <SelectTrigger className={triggerClasses}>
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <UserCircle className="h-4 w-4 text-amber-500" />
            <SelectValue placeholder="Institute / Mentor" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-100 shadow-xl z-[200]" position="popper" side="bottom" sideOffset={5}>
          <SelectItem value="ALL" className="cursor-pointer">All Institutes & Tutors</SelectItem>
          <SelectItem value="INSTITUTE" className="cursor-pointer">Coaching Institutes</SelectItem>
          <SelectItem value="INDIVIDUAL" className="cursor-pointer">Individual Tutors</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currentRating} onValueChange={(val) => handleFilterChange("rating", val)}>
        <SelectTrigger className={triggerClasses}>
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <Star className="h-4 w-4 text-amber-500" />
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

      <Select value={currentFee} onValueChange={(val) => handleFilterChange("fee", val)}>
        <SelectTrigger className={triggerClasses}>
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <IndianRupee className="h-4 w-4 text-amber-500" />
            <SelectValue placeholder="Fees" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-100 shadow-xl z-[200]" position="popper" side="bottom" sideOffset={4}>
          <SelectItem value="all" className="cursor-pointer">Any Fee</SelectItem>
          <SelectItem value="50000" className="cursor-pointer">&lt; ₹50,000</SelectItem>
          <SelectItem value="100000" className="cursor-pointer">&lt; ₹1,00,000</SelectItem>
          <SelectItem value="150000" className="cursor-pointer">&lt; ₹1,50,000</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  // 🔥 Detailed Filters (Modes, Checkboxes, Actions)
  const renderDetailedFilters = () => (
    <>
      <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm mt-1">
        <div className="flex items-center gap-2 font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
          <MonitorSmartphone className="h-5 w-5 text-amber-500" />
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
                id={`cat-mode-${mode.id}`}
                checked={currentModes.includes(mode.id)}
                onCheckedChange={() => toggleMode(mode.id)}
                className="h-5 w-5 rounded-[6px] border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 transition-all cursor-pointer"
              />
              <Label
                htmlFor={`cat-mode-${mode.id}`}
                className="cursor-pointer text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors flex-1"
              >
                {mode.label}
              </Label>
            </div>
          ))}
        </div>
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