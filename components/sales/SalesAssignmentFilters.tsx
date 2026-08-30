"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Search, Filter, X } from "lucide-react";

interface SalesAssignmentFiltersProps {
    categories: { id: string; name: string }[];
}

export default function SalesAssignmentFilters({ categories }: SalesAssignmentFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("search") || "");

    const updateParams = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete("page");
        router.push(`?${params.toString()}`);
    }, [router, searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateParams("search", search);
    };

    const clearFilters = () => {
        setSearch("");
        router.push("?");
    };

    const hasFilters = searchParams.get("search") || searchParams.get("status") || searchParams.get("category");

    return (
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search institutes..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all"
                    />
                </form>

                {/* Status Filter */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                        value={searchParams.get("status") || ""}
                        onChange={(e) => updateParams("status", e.target.value)}
                        className="pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all appearance-none cursor-pointer min-w-[160px]"
                    >
                        <option value="">All Statuses</option>
                        <option value="NOT_CONTACTED">Not Contacted</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="IN_PROCESS">In Process</option>
                        <option value="ONBOARDED">Onboarded</option>
                    </select>
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                    <select
                        value={searchParams.get("category") || ""}
                        onChange={(e) => updateParams("category", e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all appearance-none cursor-pointer min-w-[160px]"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                )}

                {/* Clear */}
                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-all shrink-0"
                    >
                        <X className="w-3.5 h-3.5" /> Clear
                    </button>
                )}
            </div>
        </div>
    );
}
