"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback, useEffect, useTransition } from "react";
import { Search, Filter, X, ChevronDown, Loader2 } from "lucide-react";

interface SalesAssignmentFiltersProps {
  categories: { id: string; name: string }[];
}

export default function SalesAssignmentFilters({ categories }: SalesAssignmentFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingField, setPendingField] = useState<string | null>(null);

  const currentSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(currentSearch);

  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    if (!isPending) {
      setPendingField(null);
    }
  }, [isPending]);

  const updateParams = useCallback(
    (key: string, value: string) => {
      setPendingField(key);
      const params = new URLSearchParams(searchParams.toString());
      if (value && value.trim()) {
        params.set(key, value.trim());
      } else {
        params.delete(key);
      }
      params.delete("page");
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams("search", search);
  };

  const clearFilters = () => {
    setPendingField("clear");
    setSearch("");
    const currentView = searchParams.get("view");
    const params = new URLSearchParams();
    if (currentView) params.set("view", currentView);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const hasFilters =
    Boolean(searchParams.get("search")) ||
    Boolean(searchParams.get("status")) ||
    Boolean(searchParams.get("category"));

  const isStatusLoading = isPending && pendingField === "status";
  const isCategoryLoading = isPending && pendingField === "category";
  const isSearchLoading = isPending && pendingField === "search";

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 w-full max-w-full overflow-hidden transition-all">
      <div className="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-2.5 w-full min-w-0">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 min-w-[180px] relative w-full sm:w-auto">
          {isSearchLoading ? (
            <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 animate-spin" />
          ) : (
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          )}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => updateParams("search", search)}
            placeholder="Search institute name, city, address..."
            disabled={isPending}
            className={`w-full pl-10 pr-9 py-2.5 rounded-xl border bg-white text-sm focus:ring-2 focus:ring-teal-500/20 outline-none transition-all disabled:opacity-75 ${
              isSearchLoading
                ? "border-teal-400 bg-teal-50/20"
                : "border-slate-200 focus:border-teal-400"
            }`}
          />
          {search && !isPending && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                updateParams("search", "");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Status Filter */}
        <div className="relative w-full sm:w-auto shrink-0">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            value={searchParams.get("status") || ""}
            onChange={(e) => updateParams("status", e.target.value)}
            disabled={isPending}
            className={`w-full sm:w-auto pl-8 pr-8 py-2.5 rounded-xl border bg-white text-xs font-bold focus:ring-2 focus:ring-teal-500/20 outline-none transition-all appearance-none cursor-pointer disabled:opacity-75 ${
              isStatusLoading
                ? "border-teal-400 text-teal-700 bg-teal-50/40"
                : "border-slate-200 text-slate-700 focus:border-teal-400"
            }`}
          >
            <option value="">All Statuses</option>
            <option value="NOT_CONTACTED">Not Contacted</option>
            <option value="CONTACTED">Contacted</option>
            <option value="IN_PROCESS">In Process</option>
            <option value="ONBOARDED">Onboarded</option>
            <option value="UPGRADED">Upgraded 🚀</option>
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {isStatusLoading ? (
              <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="relative w-full sm:w-auto shrink-0 max-w-full">
            <select
              value={searchParams.get("category") || ""}
              onChange={(e) => updateParams("category", e.target.value)}
              disabled={isPending}
              className={`w-full sm:w-auto pl-3 pr-8 py-2.5 rounded-xl border bg-white text-xs font-bold focus:ring-2 focus:ring-teal-500/20 outline-none transition-all appearance-none cursor-pointer max-w-[220px] truncate disabled:opacity-75 ${
                isCategoryLoading
                  ? "border-teal-400 text-teal-700 bg-teal-50/40"
                  : "border-slate-200 text-slate-700 focus:border-teal-400"
              }`}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              {isCategoryLoading ? (
                <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
          </div>
        )}

        {/* Loading Indicator Pill */}
        {isPending && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-teal-100/70 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 shrink-0 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
            <span>
              {isStatusLoading
                ? "Filtering status..."
                : isCategoryLoading
                ? "Filtering category..."
                : isSearchLoading
                ? "Searching..."
                : "Updating..."}
            </span>
          </div>
        )}

        {/* Clear */}
        {hasFilters && !isPending && (
          <button
            onClick={clearFilters}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Animated Loading Bar when filtering */}
      {isPending && (
        <div className="w-full bg-slate-200/70 h-1 rounded-full overflow-hidden animate-in fade-in duration-150">
          <div className="bg-teal-500 h-full w-full animate-pulse rounded-full" />
        </div>
      )}
    </div>
  );
}
