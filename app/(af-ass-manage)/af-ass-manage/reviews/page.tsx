import { ReviewStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { approveReview, rejectReview, approveReply, rejectReply } from "@/lib/User/admin/adminReview";
import { CheckCircle, XCircle, Star, MessageSquare, Filter } from "lucide-react";
import Link from "next/link";
import React from "react";
import AdminDeleteButton from "@/components/admin/AdminDeleteButton";
import { deleteReviewAction, deleteReplyAction } from "./actions";

// Server Component: Database se reviews fetch karega
export default async function AdminReviewsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams;
  const currentFilter = params.status || 'PENDING';

  // Build filter condition
  const whereCondition: any = {};
  const repliesFilter: any = {
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' as const }
  };

  if (currentFilter !== 'ALL') {
    whereCondition.OR = [
      { status: currentFilter as ReviewStatus },
      { replies: { some: { status: currentFilter as ReviewStatus } } }
    ];
    repliesFilter.where = { status: currentFilter as ReviewStatus };
  }

  const reviews = await prisma.review.findMany({
    where: whereCondition,
    include: {
      user: { select: { name: true, email: true } },
      institute: { select: { name: true, id: true } },
      replies: repliesFilter
    },
    orderBy: { createdAt: "desc" },
  });

  const filterOptions = [
    { label: "All", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <div className="p-8 w-full min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-stone-100 text-stone-700 rounded-xl">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Review Moderation</h1>
            <p className="text-sm text-slate-500">Manage student reviews across academies. (Showing: {currentFilter})</p>
          </div>
        </div>
        <div className="bg-stone-100 text-stone-800 px-4 py-2 rounded-xl font-bold text-sm shrink-0">
          Total: {reviews.length}
        </div>
      </div>

      {/* 🚀 Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
        <div className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mr-2">
          <Filter className="w-4 h-4" /> Filter:
        </div>
        {filterOptions.map((opt: any) => (
          <Link 
            key={opt.value}
            href={`/af-ass-manage/reviews?status=${opt.value}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              currentFilter === opt.value 
              ? "bg-stone-900 text-white shadow-md shadow-stone-900/20 scale-105" 
              : "bg-white border border-stone-100 text-slate-500 hover:bg-stone-50 hover:text-stone-700 hover:border-stone-200"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center shadow-sm mt-4">
          <MessageSquare className="h-16 w-16 text-slate-200 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700">All caught up!</h3>
          <p className="text-slate-500">No {currentFilter.toLowerCase()} reviews found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm mt-4">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100/50 text-slate-500 uppercase tracking-wider text-xs font-bold">
                  <th className="p-4">User</th>
                  <th className="p-4">Institute</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4 w-1/3">Comment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100/50 text-sm">
                {reviews.map((review: any) => (
                  <React.Fragment key={review.id}>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* User Info */}
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{review.user?.name || "Anonymous"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{review.user?.email || "No Email"}</p>
                    </td>

                    {/* Institute Info */}
                    <td className="p-4">
                      <p className="font-semibold text-blue-600 hover:underline cursor-pointer">
                        <Link href={`/af-ass-manage/institutes/${review.institute.id}`}>
                          {review.institute.name}
                        </Link>
                      </p>
                    </td>

                    {/* Rating */}
                    <td className="p-4">
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 text-slate-700 w-max px-2.5 py-1 rounded-lg">
                        <span className="font-extrabold text-sm">{review.rating}</span>
                        <Star className="h-3.5 w-3.5 fill-stone-400 text-stone-400" />
                      </div>
                    </td>

                    {/* Comment */}
                    <td className="p-4">
                      <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">
                        {review.comment || <span className="italic text-slate-400">No comment provided</span>}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                        review.status === "PENDING" ? "bg-stone-50 text-stone-700 border-stone-200" :
                        review.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {review.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right align-top">
                      <div className="flex items-center justify-end gap-2">
                        {review.status === "PENDING" ? (
                          <>
                            {/* Approve Button */}
                            <form action={async () => {
                              "use server";
                              await approveReview(review.id, review.institute.id);
                            }}>
                              <button 
                                type="submit"
                                title="Approve"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold"
                              >
                                <CheckCircle className="h-4 w-4" /> Approve
                              </button>
                            </form>

                            {/* Reject Button */}
                            <form action={async () => {
                              "use server";
                              await rejectReview(review.id);
                            }}>
                              <button 
                                type="submit"
                                title="Reject"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all text-xs font-bold"
                              >
                                <XCircle className="h-4 w-4" /> Reject
                              </button>
                            </form>
                          </>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            Processed
                          </span>
                        )}
                        <AdminDeleteButton id={review.id} onDelete={deleteReviewAction} title="Delete Review?" />
                      </div>
                    </td>

                  </tr>
                  
                  {/* Render Replies for this review */}
                  {review.replies && review.replies.length > 0 && review.replies.map((reply: any) => (
                    <tr key={reply.id} className="bg-slate-50/30 border-b border-stone-100/30">
                      <td className="p-4 pl-8 border-l-2 border-indigo-200">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mr-2">REPLY</span>
                        <p className="font-bold text-slate-900 inline-block">{reply.user?.name || "Anonymous"}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{reply.user?.email || "No Email"}</p>
                      </td>
                      <td className="p-4" colSpan={2}>
                         <p className="text-xs text-slate-400 italic">Reply to Review on {review.institute.name}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200 text-sm">
                          {reply.content}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                          reply.status === "PENDING" ? "bg-stone-50 text-stone-700 border-stone-200" :
                          reply.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {reply.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {reply.status === "PENDING" ? (
                            <>
                              <form action={async () => {
                                "use server";
                                await approveReply(reply.id);
                              }}>
                                <button type="submit" title="Approve Reply" className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold">
                                  <CheckCircle className="h-4 w-4" /> Approve
                                </button>
                              </form>
                              <form action={async () => {
                                "use server";
                                await rejectReply(reply.id);
                              }}>
                                <button type="submit" title="Reject Reply" className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all text-xs font-bold">
                                  <XCircle className="h-4 w-4" /> Reject
                                </button>
                              </form>
                            </>
                          ) : (
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                              Processed
                            </span>
                          )}
                          <AdminDeleteButton id={reply.id} onDelete={deleteReplyAction} title="Delete Reply?" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}