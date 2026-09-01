export default function SalesAssignmentsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded-xl mb-2" />
          <div className="h-4 w-72 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-24 bg-slate-200 rounded-xl" />
          <div className="h-10 w-24 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5 items-center">
          <div className="h-10 flex-1 bg-slate-200/80 rounded-xl w-full" />
          <div className="h-10 w-36 bg-slate-200/80 rounded-xl" />
          <div className="h-10 w-44 bg-slate-200/80 rounded-xl" />
        </div>
      </div>

      {/* Assignment Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-48 bg-slate-200 rounded-lg" />
                  <div className="h-5 w-24 bg-slate-100 rounded-full" />
                </div>
                <div className="flex gap-3">
                  <div className="h-4 w-20 bg-slate-100 rounded" />
                  <div className="h-4 w-28 bg-slate-100 rounded" />
                  <div className="h-4 w-32 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-9 w-28 bg-slate-200 rounded-xl shrink-0" />
            </div>
            <div className="h-4 w-64 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
