"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Filter } from "lucide-react";
import { useCallback, useState } from "react";

interface SalesInstituteFiltersProps {
    cities: { id: string; name: string }[];
    categories: { id: string; name: string }[];
}

export default function SalesInstituteFilters({
    cities,
    categories,
}: SalesInstituteFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentSearch = searchParams.get("search") || "";
    const currentCity = searchParams.get("cityId") || "";
    const currentCategory = searchParams.get("categoryId") || "";
    const currentStatus = searchParams.get("status") || "all";
    const currentSubscriptionPlan = searchParams.get("subscriptionPlan") || "";
    const currentSortBy = searchParams.get("sortBy") || "name_asc";
    const currentAssignment = searchParams.get("assignment") || "all";

    const [searchInput, setSearchInput] = useState(currentSearch);

    const updateFilter = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value && value !== "all" && value !== "name_asc") {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    }, [pathname, router, searchParams]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilter("search", searchInput.trim());
    };

    const clearAllFilters = () => {
        setSearchInput("");
        router.push(pathname);
    };

    const hasActiveFilters =
        currentSearch ||
        currentCity ||
        currentCategory ||
        (currentStatus && currentStatus !== "all") ||
        currentSubscriptionPlan ||
        (currentSortBy && currentSortBy !== "name_asc") ||
        (currentAssignment && currentAssignment !== "all");

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <Filter className="w-4 h-4 text-teal-600" />
                    <span>Filter & Search Institutes</span>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                    >
                        <X className="w-3.5 h-3.5" /> Clear Filters
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {/* 1. Search Bar */}
                <form onSubmit={handleSearchSubmit} className="col-span-1 sm:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search institute name..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onBlur={() => updateFilter("search", searchInput.trim())}
                        className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all"
                    />
                    {searchInput ? (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchInput("");
                                updateFilter("search", "");
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    ) : null}
                </form>

                {/* 2. Sort Dropdown */}
                <div>
                    <select
                        value={currentSortBy}
                        onChange={(e) => updateFilter("sortBy", e.target.value)}
                        className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none cursor-pointer"
                    >
                        <option value="name_asc">Name (A → Z)</option>
                        <option value="newest">Latest Added</option>
                        <option value="oldest">Oldest Added</option>
                        <option value="views">Most Viewed</option>
                    </select>
                </div>

                {/* 3. Status & Visibility Filter */}
                <div>
                    <select
                        value={currentStatus}
                        onChange={(e) => updateFilter("status", e.target.value)}
                        className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none cursor-pointer"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">🟢 Active Only</option>
                        <option value="inactive">🔴 Inactive Only</option>
                        <option value="published">👁️ Published Only</option>
                        <option value="hidden">🙈 Hidden Only</option>
                    </select>
                </div>

                {/* 4. Subscription Plan Filter */}
                <div>
                    <select
                        value={currentSubscriptionPlan}
                        onChange={(e) => updateFilter("subscriptionPlan", e.target.value)}
                        className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none cursor-pointer"
                    >
                        <option value="">All Plans</option>
                        <option value="BASIC">Basic</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="PREMIUM">Premium</option>
                        <option value="ULTRA">Ultra</option>
                    </select>
                </div>

                {/* 5. City Filter */}
                <div>
                    <select
                        value={currentCity}
                        onChange={(e) => updateFilter("cityId", e.target.value)}
                        className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none cursor-pointer"
                    >
                        <option value="">All Cities</option>
                        {cities.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 6. Category Filter */}
                <div>
                    <select
                        value={currentCategory}
                        onChange={(e) => updateFilter("categoryId", e.target.value)}
                        className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none cursor-pointer"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 7. Assignment Filter */}
                <div>
                    <select
                        value={currentAssignment}
                        onChange={(e) => updateFilter("assignment", e.target.value)}
                        className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none cursor-pointer"
                    >
                        <option value="all">All Assignments</option>
                        <option value="my_assignments">Assigned to Me</option>
                        <option value="unassigned">Unassigned</option>
                        <option value="other_assignments">Assigned to Others</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
