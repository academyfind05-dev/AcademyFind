"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch"; // 👈 Switch component import kiya
import { Layers, MapPin, Star, Sparkles, Filter, Navigation, LocateFixed, Home } from "lucide-react"; // 👈 Home icon add kiya

type FilterProps = {
  categories: { name: string; slug: string }[];
  cities: { name: string; slug: string }[];
  currentType: string;
  currentCity: string;
  currentCategory: string;
  currentRating: string;
  currentLat?: string;
  currentLng?: string;
  currentRadius?: string;
  currentSort?: string;
  currentProviderType?: string;
};

export default function SearchFilters({
  categories, cities, currentType, currentCity, currentCategory, currentRating, currentLat, currentLng, currentRadius, currentSort, currentProviderType
}: FilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();


  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // 🔥 Toggle OFF Logic: Agar user dubara same active button pe click karta hai
    if (key === "sort" && value === "remove_sort") {
      params.delete("sort");
      params.delete("userlat");
      params.delete("userlng");
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
      return;
    }

    // GPS Location Permission Logic
    if (key === "sort" && value === "nearest_me" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        params.set("userlat", latitude.toString());
        params.set("userlng", longitude.toString());
        params.set(key, value);
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
      }, (error) => {
        console.error("Error getting geolocation:", error);
        params.delete("userlat");
        params.delete("userlng");
        router.push(`${pathname}?${params.toString()}`);
      })
      return;
    }

    if (key === "sort" && value === "nearest_location") {
      params.delete("userlat");
      params.delete("userlng");
      params.set(key, value);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
      return;
    }

    // NORMALS FILTERS LOGIC
    if (value && value !== "ALL") params.set(key, value);
    else params.delete(key);

    if (key === "type" && value !== "institute") params.delete("rating");

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const triggerClasses = "w-full rounded-xl border-slate-200 bg-slate-50/50 hover:bg-amber-50/30 hover:border-amber-300 focus:ring-2 focus:ring-amber-400 focus:ring-offset-0 focus:outline-none transition-all data-[state=open]:bg-amber-50/50 data-[state=open]:border-amber-400 h-11 text-sm shadow-xs font-medium text-slate-700";

  // 🔥 Check kaunsa button exactly active hai
  const isNearestLocation = currentSort === "nearest_location";
  // currentCategory aapke slug ke hisaab se "home_tuition" ya "home-tuition" ho sakti hai
  const checkedHomeTuition = currentCategory === "home_tuition" || currentCategory === "home-tuition";

  const FiltersContent = (
    <div className="space-y-6">
      {currentLat && currentLng && (
        <div className="space-y-5 rounded-2xl">

          {/* 🔥 Interactive Toggle Buttons */}
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Sort Results By</label>
            <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-inner border border-slate-200/60">
              <button
                onClick={() => handleFilterChange("sort", isNearestLocation ? "remove_sort" : "nearest_location")}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg transition-all duration-300 ${isNearestLocation
                  ? 'bg-amber-400 text-white shadow-md ring-1 ring-amber-500/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
              >
                <Navigation className={`w-3.5 h-3.5 ${isNearestLocation ? 'text-white' : 'text-slate-400'}`} /> Searched Area
              </button>
            </div>
          </div>

          {/* Distance Filter */}
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Maximum Distance</label>
            <Select value={currentRadius || "5"} onValueChange={(val) => handleFilterChange("radius", val)}>
              <SelectTrigger className="w-full rounded-xl border-white bg-white hover:border-amber-300 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all h-11 text-sm shadow-sm font-medium text-slate-700">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-amber-400 shrink-0" />
                  <SelectValue placeholder="Select Distance" />
                </div>
              </SelectTrigger>
              {/* FIX: Added position="popper", sideOffset, and z-[999] */}
              <SelectContent position="popper" sideOffset={5} className="rounded-xl border-slate-100 shadow-xl z-[999]">
                <SelectItem value="ALL" className="cursor-pointer font-medium">Any Distance</SelectItem>
                <SelectItem value="1" className="cursor-pointer font-medium">&lt; 1 km</SelectItem>
                <SelectItem value="2" className="cursor-pointer font-medium">&lt; 2 km</SelectItem>
                <SelectItem value="5" className="cursor-pointer font-medium">&lt; 5 km</SelectItem>
                <SelectItem value="10" className="cursor-pointer font-medium">&lt; 10 km</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Result Type</label>
        <Select value={currentType || "ALL"} onValueChange={(val) => handleFilterChange("type", val)}>
          <SelectTrigger className={triggerClasses}>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400 shrink-0" />
              <SelectValue placeholder="Everything" />
            </div>
          </SelectTrigger>
          {/* FIX: Added position="popper" and changed to z-[999] */}
          <SelectContent position="popper" sideOffset={5} className="rounded-xl border-slate-100 shadow-xl max-h-60 z-[999]">
            <SelectItem value="ALL" className="cursor-pointer font-medium">Everything</SelectItem>
            <SelectItem value="institute" className="cursor-pointer font-medium">Institutes</SelectItem>
            <SelectItem value="job" className="cursor-pointer font-medium">Careers & Jobs</SelectItem>
            <SelectItem value="blog" className="cursor-pointer font-medium">Blogs & Articles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* PROVIDER TYPE FILTER */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Institute / Mentor</label>
        <Select value={currentProviderType || "ALL"} onValueChange={(val) => handleFilterChange("providerType", val)}>
          <SelectTrigger className={triggerClasses}>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={5} className="rounded-xl border-slate-200 shadow-xl bg-white/95 backdrop-blur-xl z-[999]">
            <SelectItem value="ALL" className="cursor-pointer font-medium">All Institutes & Tutors</SelectItem>
            <SelectItem value="INSTITUTE" className="cursor-pointer font-medium">Coaching Institutes</SelectItem>
            <SelectItem value="INDIVIDUAL" className="cursor-pointer font-medium">Individual Tutors</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 🔥 HOME TUITION TOGGLE BUTTON */}
      <div className="flex items-center justify-between p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="text-amber-400 rounded-lg">
            <Home className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 text-left">
            <label className="text-sm font-bold text-slate-800 cursor-pointer">Home Tuition</label>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Tutors at your doorstep</p>
          </div>
        </div>
        <Switch
          checked={checkedHomeTuition}
          onCheckedChange={(checked) => handleFilterChange("category", checked ? "home_tuition" : "ALL")}
          className="data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 h-5 w-10 rounded-full border bg-slate-200 transition-all shadow-sm"
        />
      </div>

      {/* CATEGORY FILTER */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Category</label>
        <Select value={currentCategory || "ALL"} onValueChange={(val) => handleFilterChange("category", val)}>
          <SelectTrigger className={triggerClasses}>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400 shrink-0" />
              <SelectValue placeholder="All Categories" />
            </div>
          </SelectTrigger>
          {/* FIX: Added position="popper" and changed to z-[999] */}
          <SelectContent position="popper" sideOffset={5} className="rounded-xl border-slate-100 shadow-xl max-h-64 z-[999]">
            <SelectItem value="ALL" className="cursor-pointer font-medium">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.slug} value={c.slug} className="cursor-pointer font-medium">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!currentLat && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">City</label>
          <Select value={currentCity || "ALL"} onValueChange={(val) => handleFilterChange("city", val)}>
            <SelectTrigger className={triggerClasses}>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                <SelectValue placeholder="All Cities" />
              </div>
            </SelectTrigger>
            {/* FIX: Added position="popper" and changed to z-[999] */}
            <SelectContent position="popper" sideOffset={5} className="rounded-xl border-slate-100 shadow-xl max-h-64 z-[999]">
              <SelectItem value="ALL" className="cursor-pointer font-medium">All Cities</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c.slug} value={c.slug} className="cursor-pointer font-medium">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(currentType === "ALL" || currentType === "institute" || !currentType) && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Minimum Rating</label>
          <Select value={currentRating || "ALL"} onValueChange={(val) => handleFilterChange("rating", val)}>
            <SelectTrigger className={triggerClasses}>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400 shrink-0" />
                <SelectValue placeholder="Any Rating" />
              </div>
            </SelectTrigger>
            {/* FIX: Added position="popper" and changed to z-[999] */}
            <SelectContent position="popper" sideOffset={5} className="rounded-xl border-slate-100 shadow-xl z-[999]">
              <SelectItem value="ALL" className="cursor-pointer font-medium">Any Rating</SelectItem>
              <SelectItem value="4" className="cursor-pointer font-medium">4.0 & Above</SelectItem>
              <SelectItem value="4.5" className="cursor-pointer font-medium">4.5 & Above</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="lg:hidden mb-4 sticky top-[70px] z-40 bg-white/80 backdrop-blur-md pt-2 pb-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-between border-slate-200 bg-white shadow-sm rounded-2xl py-6 font-bold text-slate-700 hover:bg-slate-50 ring-1 ring-slate-900/5">
              <span className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-amber-400" />
                Filter Results
              </span>
              <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full text-slate-500">Tap to open</span>
            </Button>
          </SheetTrigger>
          {/* h-[85vh] ko relative banaya aur padding adjust ki taaki button bottom me fix rahe */}
          <SheetContent side="bottom" className="rounded-t-3xl h-[85vh] flex flex-col px-0 py-5 z-[103]">
            <SheetHeader className="pb-4 border-b border-slate-100 mb-2 px-6 text-left">
              <SheetTitle className="flex items-center gap-2 text-xl font-extrabold text-slate-800">
                <Sparkles className="w-5 h-5 text-amber-400" /> Refine Search
              </SheetTitle>
            </SheetHeader>

            {/* Scrollable Filters Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-24">
              {FiltersContent}
            </div>

            {/* 🔥 CLOSE / APPLY BUTTON (Sticky at Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
              <SheetClose asChild>
                <Button className="w-full bg-amber-400 hover:bg-amber-500 text-white font-bold py-6 rounded-xl text-md shadow-md transition-all">
                  Apply & View Results
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <aside className="sticky top-24 hidden h-fit rounded-3xl border bg-background p-6 shadow-sm lg:block border-slate-200 z-10">
        <h3 className="font-extrabold text-slate-900 mb-6 text-lg tracking-tight pb-3 border-b border-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> Filters
        </h3>
        {FiltersContent}
      </aside>
    </>
  );
}