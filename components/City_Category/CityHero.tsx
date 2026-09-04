import { Building2, ShieldCheck, Star } from "lucide-react";
import { SearchBar } from "../search/SearchBar";

export default function CityHero({
  categoryName,
  cityName,
  totalCount,
}: {
  categoryName: string;
  cityName: string;
  totalCount: number;
}) {
  return (
    <section className="relative overflow-y-visible z-[101] rounded-3xl border border-amber-100 bg-linear-to-br from-amber-50 via-white to-orange-50 p-6 md:p-12 mb-12">
      
      {/* Glow */}
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />

      <div className="relative">
        <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-4 py-1 text-sm font-medium text-amber-400">
          📍 {cityName}
        </div>

        <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
          Best {categoryName}
          <br />
          Institutes in {cityName}
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-600">
          Compare fees, ratings, reviews, faculty and courses
          from the highest-rated institutes in {cityName}.
        </p>

        {/* 🚀 STATS SECTION - Modern Mobile Card Layout */}
        <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl">
          
          {/* Stat 1 */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 rounded-2xl border border-amber-100 bg-white/90 p-2.5 sm:p-4 shadow-xs backdrop-blur-sm text-center sm:text-left transition-all hover:shadow-md">
            <div className="p-2 rounded-xl bg-amber-100/70 text-amber-600 shrink-0">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-sm sm:text-xl font-extrabold text-slate-900 leading-tight">
                {totalCount}
              </p>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-none mt-0.5">
                Institutes
              </p>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 rounded-2xl border border-amber-100 bg-white/90 p-2.5 sm:p-4 shadow-xs backdrop-blur-sm text-center sm:text-left transition-all hover:shadow-md">
            <div className="p-2 rounded-xl bg-amber-100/70 text-amber-600 shrink-0">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-sm sm:text-xl font-extrabold text-slate-900 leading-tight">
                100%
              </p>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-none mt-0.5">
                Verified
              </p>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 rounded-2xl border border-amber-100 bg-white/90 p-2.5 sm:p-4 shadow-xs backdrop-blur-sm text-center sm:text-left transition-all hover:shadow-md">
            <div className="p-2 rounded-xl bg-amber-100/70 text-amber-600 shrink-0">
              <Star className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-sm sm:text-xl font-extrabold text-slate-900 leading-tight">
                Top Rated
              </p>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-none mt-0.5">
                Choices
              </p>
            </div>
          </div>

        </div>

        {/* Search Bar */}
        <div className="mt-8 rounded-3xl border border-amber-100 bg-white/95 p-2 shadow-[0_20px_60px_rgba(251,191,36,0.15)] backdrop-blur-sm sm:p-4">
          <SearchBar />
        </div>
      </div>
    </section>
  );
}