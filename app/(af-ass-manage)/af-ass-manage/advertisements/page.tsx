import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, XCircle, Eye, EyeOff, Trash2, Megaphone } from "lucide-react";
import { updateAdvertisementStatus } from "@/lib/advertisement/admin-actions";
import { getAdSettings } from "@/lib/advertisement/admin-settings-actions";
import AdminAdSettingsWrapper from "@/components/advertisement/AdminAdSettingsWrapper";
import { Advertisement } from "@/app/generated/prisma/client";
import AdminDeleteButton from "@/components/admin/AdminDeleteButton";
import { deleteAdvertisementAction } from "./actions";

export const metadata = {
    title: "Manage Advertisements | Admin",
};

export default async function AdminAdvertisementsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const resolvedParams = await searchParams;
    const currentFilter = resolvedParams.filter || "ALL";
    const initialSettings = await getAdSettings();

    let whereClause: any = {};
    if (currentFilter === "RENEWALS") {
        whereClause.isRenewalRequest = true;
    } else if (currentFilter === "EDIT_PENDING") {
        whereClause.editRequestData = { not: null };
    } else if (currentFilter !== "ALL") {
        whereClause.status = currentFilter;
    }

    const advertisements = await prisma.advertisement.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    phone: true,
                }
            }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Advertisement Approvals</h1>
                    <p className="text-sm text-slate-500">Manage user-submitted advertisements for the homepage banner.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <AdminAdSettingsWrapper initialSettings={initialSettings} />
                    <div className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm border border-slate-200">
                        Total: {advertisements.length}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
                <Link href="/af-ass-manage/advertisements?filter=ALL" className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${currentFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>All</Link>
                <Link href="/af-ass-manage/advertisements?filter=PENDING" className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${currentFilter === 'PENDING' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Pending</Link>
                <Link href="/af-ass-manage/advertisements?filter=APPROVED" className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${currentFilter === 'APPROVED' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Approved</Link>
                <Link href="/af-ass-manage/advertisements?filter=REJECTED" className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${currentFilter === 'REJECTED' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Rejected</Link>
                <Link href="/af-ass-manage/advertisements?filter=EXPIRED" className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${currentFilter === 'EXPIRED' ? 'bg-slate-500 text-white border-slate-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Expired</Link>
                <Link href="/af-ass-manage/advertisements?filter=RENEWALS" className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${currentFilter === 'RENEWALS' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Renewal Requests</Link>
                <Link href="/af-ass-manage/advertisements?filter=EDIT_PENDING" className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${currentFilter === 'EDIT_PENDING' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Edit Pending</Link>
            </div>

            <div className="grid gap-6">
                {advertisements.map((ad: any) => (
                    <div key={ad.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
                        <div className="flex flex-col md:flex-row">
                            {/* Image Thumbnails */}
                            <div className="relative h-48 w-full md:h-auto md:w-72 shrink-0 bg-slate-100 overflow-hidden">
                                {ad.images && ad.images.length > 0 ? (
                                    ad.images.length === 1 ? (
                                        <img src={ad.images[0]} alt={ad.title} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-0.5 bg-white">
                                            {ad.images.slice(0, 4).map((img: any, i: number) => (
                                                <img key={i} src={img} alt={`${ad.title} ${i + 1}`} className="h-full w-full object-cover" />
                                            ))}
                                            {/* Fill empty spots if less than 4 but more than 1 */}
                                            {Array.from({ length: 4 - ad.images.slice(0, 4).length }).map((_, i: number) => (
                                                <div key={`empty-${i}`} className="bg-slate-100 h-full w-full" />
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-400">No Image</div>
                                )}
                                <div className="absolute top-2 left-2 flex flex-col gap-1">
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm inline-block self-start ${ad.status === 'APPROVED' ? 'bg-green-500' :
                                        ad.status === 'REJECTED' ? 'bg-red-500' :
                                            ad.status === 'EXPIRED' ? 'bg-slate-500' : 'bg-amber-500'
                                        }`}>
                                        {ad.status}
                                    </span>
                                    {ad.editRequestData && (
                                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-500 text-white shadow-sm inline-block self-start">
                                            Edit Pending
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 p-5">
                                <div className="flex flex-col justify-between h-full">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{ad.title}</h3>
                                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{ad.description || "No description provided."}</p>

                                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600 md:grid-cols-4">
                                            <div>
                                                <p className="font-semibold text-slate-400 text-xs uppercase">Advertiser</p>
                                                <p className="font-medium text-slate-800">{ad.user.name || "Unknown"}</p>
                                                <p className="text-xs">{ad.user.phone || ad.user.email}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-400 text-xs uppercase">Payment Details</p>
                                                <p className="font-medium text-amber-600">₹{ad.pricePaid}</p>
                                                <p className="text-xs truncate" title={ad.utrNumber || ""}>UTR: {ad.utrNumber}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-400 text-xs uppercase">Dates</p>
                                                <p>Submitted: {format(new Date(ad.createdAt), "dd MMM, yyyy")}</p>
                                                {ad.startDate && <p className="text-xs text-green-600">Active since: {format(new Date(ad.startDate), "dd MMM")}</p>}
                                                {ad.expiryDate && <p className="text-xs text-red-500">Expires: {format(new Date(ad.expiryDate), "dd MMM")}</p>}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-400 text-xs uppercase">Analytics</p>
                                                <p className="text-slate-800">Views: <strong className="text-amber-500">{ad.views}</strong></p>
                                                <p className="text-slate-800">Clicks: <strong className="text-amber-500">{ad.clicks}</strong></p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                                        <div className="flex-1 flex gap-2">
                                            {ad.paymentScreenshot && (
                                                <a href={ad.paymentScreenshot} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                                                    View Payment Screenshot
                                                </a>
                                            )}
                                            {ad.linkUrl && (
                                                <a href={ad.linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                                                    Target Link
                                                </a>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 items-center">
                                            <Link href={`/af-ass-manage/advertisements/${ad.id}`} className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600">
                                                View Details
                                            </Link>

                                            {ad.status === "PENDING" && (
                                                <>
                                                    <form action={async () => { "use server"; await updateAdvertisementStatus(ad.id, "APPROVED"); }}>
                                                        <button className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600">
                                                            <CheckCircle className="h-4 w-4" /> Approve
                                                        </button>
                                                    </form>
                                                    <form action={async () => { "use server"; await updateAdvertisementStatus(ad.id, "REJECTED"); }}>
                                                        <button className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600">
                                                            <XCircle className="h-4 w-4" /> Reject
                                                        </button>
                                                    </form>
                                                </>
                                            )}

                                            {ad.status === "APPROVED" && (
                                                <form action={async () => { "use server"; await updateAdvertisementStatus(ad.id, ad.visibility === "VISIBLE" ? "HIDDEN" : "VISIBLE"); }}>
                                                    <button className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
                                                        {ad.visibility === "VISIBLE" ? (
                                                            <><EyeOff className="h-4 w-4 text-amber-500" /> Hide</>
                                                        ) : (
                                                            <><Eye className="h-4 w-4 text-green-500" /> Show</>
                                                        )}
                                                    </button>
                                                </form>
                                            )}

                                            <AdminDeleteButton id={ad.id} onDelete={deleteAdvertisementAction} title="Delete Ad?" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
