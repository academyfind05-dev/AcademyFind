"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";

interface SalesAssignmentFiltersProps {
  categories: { id: string; name: string }[];
}

export default function SalesAssignmentFilters({ categories }: SalesAssignmentFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams("search", search);
  };

  const clearFilters = () => {
    setSearch("");
    router.push("?");
  };

  const hasFilters =
    Boolean(searchParams.get("search")) ||
    Boolean(searchParams.get("status")) ||
    Boolean(searchParams.get("category"));

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-3 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-2.5 w-full min-w-0">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 min-w-[180px] relative w-full sm:w-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search institutes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all"
          />
        </form>

        {/* Status Filter */}
        <div className="relative w-full sm:w-auto shrink-0">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            value={searchParams.get("status") || ""}
            onChange={(e) => updateParams("status", e.target.value)}
            className="w-full sm:w-auto pl-8 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="NOT_CONTACTED">Not Contacted</option>
            <option value="CONTACTED">Contacted</option>
            <option value="IN_PROCESS">In Process</option>
            <option value="ONBOARDED">Onboarded</option>
            <option value="UPGRADED">Upgraded 🚀</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="relative w-full sm:w-auto shrink-0 max-w-full">
            <select
              value={searchParams.get("category") || ""}
              onChange={(e) => updateParams("category", e.target.value)}
              className="w-full sm:w-auto pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all appearance-none cursor-pointer max-w-[220px] truncate"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        )}

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
