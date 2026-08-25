"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
    ArrowLeft, ExternalLink, Edit, CheckCircle2, MapPin,
    Activity, Building2, Star, Users, Briefcase, Info,
    Send, PhoneCall, Check, X, Link as LinkIcon,
    ArrowRight, MessageSquare,
    GraduationCap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// 🚀 IMPORT PORTFOLIO COMPONENTS
import EditResultImages from "@/app/(public)/manager/[instituteId]/profile/edit/EditResultImages";
import EditVideoLinks from "@/app/(public)/manager/[instituteId]/profile/edit/EditVideoLinks";
import ClassroomImages from "@/app/(public)/manager/[instituteId]/profile/edit/EditClassroomImages";
import EditFAQs from "@/app/(public)/manager/[instituteId]/profile/edit/EditFAQS";
import EditAchievements from "@/app/(public)/manager/[instituteId]/profile/edit/EditAchievements";
import EditNotablePersons from "@/app/(public)/manager/[instituteId]/profile/edit/EditNotablePersons";
import { DemographicsCharts } from "@/components/manager/AnalyticsCharts";

export function AdminInstituteDashboardClient({ institute, analyticsData }: { institute: any, analyticsData?: any }) {

    const formatChartData = () => {
        if (!institute.dailyViews || institute.dailyViews.length === 0) return [];
        return institute.dailyViews.map((dv: any) => ({
            date: format(new Date(dv.date), "MMM dd"),
            views: dv.count
        })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    const chartData = formatChartData();

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans w-full p-4 md:p-8 animate-in fade-in duration-300">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
                <div>
                    <Link href="/af-ass-manage/institutes" className="inline-flex items-center text-sm font-semibold text-stone-500 hover:text-stone-800 transition-colors mb-2">
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Institutes
                    </Link>
                    <h1 className="text-3xl font-black text-stone-900 flex items-center gap-2">
                        {institute.name}
                        {institute.isVerified && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                    </h1>
                    <div className="text-stone-500 font-medium mt-1">
                        <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> {institute.city?.name} • {institute.providerType}
                        </p>
                        {institute.address && (
                            <p className="text-sm text-stone-400 mt-0.5 ml-6">
                                {institute.address}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <Link href={`/af-ass-manage/instituteCallbacks?instituteId=${institute.id}`} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2 border border-indigo-700">
                        <MessageSquare className="w-4 h-4" /> Manage Enquiries
                    </Link>
                    <Link href={`/institute/${institute.id}-${institute.slug}`} target="_blank" className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" /> Public View
                    </Link>
                    <Link href={`/af-ass-manage/institutes/${institute.id}/edit`} className="bg-stone-800 hover:bg-stone-900 text-stone-50 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2 border border-stone-900">
                        <Edit className="w-4 h-4" /> Master Edit Form
                    </Link>
                </div>
            </div>

            {/* QUICK STATUS BADGES */}
            <div className="flex flex-wrap gap-3">
                <Badge className={`px-3 py-1 text-xs uppercase tracking-wider font-bold ${institute.isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                    {institute.isActive ? 'System Active' : 'System Inactive'}
                </Badge>
                <Badge className={`px-3 py-1 text-xs uppercase tracking-wider font-bold ${institute.isPublished ? 'bg-stone-100 text-stone-800 border border-stone-200' : 'bg-stone-100 text-stone-500 border border-stone-200'}`}>
                    {institute.isPublished ? 'Visible to Public' : 'Hidden from Public'}
                </Badge>
                <Badge className="px-3 py-1 text-xs uppercase tracking-wider font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Plan: {institute.subscriptionPlan}
                </Badge>
                {institute.isFeatured && (
                    <Badge className="px-3 py-1 text-xs uppercase tracking-wider font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        Featured
                    </Badge>
                )}
                {institute.enquiries && institute.enquiries.length > 0 && (
                    <Badge className="px-3 py-1 text-xs tracking-wider font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                        Last Enquiry — Admin: {institute.enquiries[0].status || 'NEW'} | Student: {institute.enquiries[0].userContactStatus || 'NEW'}
                    </Badge>
                )}
            </div>

            {/* TAB SYSTEM */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-stone-100/50 p-1 mb-6 flex flex-wrap h-auto">
                    <TabsTrigger value="overview" className="flex-1 min-w-[150px] data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview & Analytics</TabsTrigger>
                    <TabsTrigger value="general" className="flex-1 min-w-[150px] data-[state=active]:bg-white data-[state=active]:shadow-sm">General Info</TabsTrigger>
                    <TabsTrigger value="batches" className="flex-1 min-w-[150px] data-[state=active]:bg-white data-[state=active]:shadow-sm">Batches & Staff</TabsTrigger>
                    <TabsTrigger value="media" className="flex-1 min-w-[150px] data-[state=active]:bg-white data-[state=active]:shadow-sm">Media & Gallery</TabsTrigger>
                    <TabsTrigger value="details" className="flex-1 min-w-[150px] data-[state=active]:bg-white data-[state=active]:shadow-sm">Details & Extras</TabsTrigger>
                </TabsList>

                {/* TAB 1: OVERVIEW & ANALYTICS */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Card className="border-stone-200 shadow-sm bg-white overflow-hidden">
                                <CardHeader className="bg-stone-50 border-b border-stone-100 pb-4">
                                    <CardTitle className="text-lg font-extrabold text-stone-800 flex items-center gap-2"><Activity className="w-5 h-5 text-stone-600" /> Analytics & Traffic</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                        <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-center shadow-inner">
                                            <p className="text-3xl font-black text-stone-800">{institute.viewCount}</p>
                                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1">Total Views</p>
                                        </div>
                                        <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-center shadow-inner">
                                            <p className="text-3xl font-black text-stone-800">{institute._count?.shortlistedBy || 0}</p>
                                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1">Shortlisted</p>
                                        </div>
                                        <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-center shadow-inner">
                                            <p className="text-3xl font-black text-stone-800">{institute.compareCount}</p>
                                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1">Compared</p>
                                        </div>
                                        <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-center shadow-inner">
                                            <p className="text-3xl font-black text-stone-800">{institute._count?.enquiries || 0}</p>
                                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1">Enquiries</p>
                                        </div>
                                    </div>

                                    <div className="h-64 w-full">
                                        <h4 className="text-sm font-bold text-stone-800 mb-4">Daily View Trends</h4>
                                        {chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} />
                                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                    <Line type="monotone" dataKey="views" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-full bg-stone-50 rounded-xl border border-stone-100 text-stone-500 text-sm">No daily view data available yet.</div>
                                        )}
                                    </div>

                                    {analyticsData && (
                                        <div className="mt-8">
                                            <h4 className="text-sm font-bold text-stone-800 mb-2">Visitor Demographics & Engagement</h4>
                                            <DemographicsCharts 
                                                cityData={analyticsData.cityData} 
                                                deviceData={analyticsData.deviceData} 
                                                avgDuration={analyticsData.avgDuration} 
                                            />
                                        </div>
                                    )}

                                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm font-bold text-stone-800 border-b border-stone-100 pb-2 mb-3">Recent Visitors</h4>
                                            {institute.viewHistory?.length > 0 ? (
                                                <ul className="space-y-3">
                                                    {institute.viewHistory.map((vh: any) => (
                                                        <li key={vh.id} className="text-sm flex justify-between items-center">
                                                            <span className="font-medium text-stone-700">{vh.user?.name || vh.user?.email || "Unknown User"}</span>
                                                            <span className="text-xs text-stone-400">{format(new Date(vh.viewedAt), "MMM d, HH:mm")}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-stone-500 italic">No logged-in visitors recently.</p>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-stone-800 border-b border-stone-100 pb-2 mb-3">Recent Shortlists (Saved)</h4>
                                            {institute.shortlistedBy?.length > 0 ? (
                                                <ul className="space-y-3">
                                                    {institute.shortlistedBy.map((sb: any) => (
                                                        <li key={sb.userId} className="text-sm flex justify-between items-center">
                                                            <span className="font-medium text-stone-700">{sb.user?.name || sb.user?.email || "Unknown User"}</span>
                                                            <span className="text-xs text-stone-400">{format(new Date(sb.createdAt), "MMM d, yyyy")}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-stone-500 italic">No recent saves.</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="border-stone-200 shadow-sm bg-white overflow-hidden">
                                <CardHeader className="bg-stone-50 border-b border-stone-100 pb-4">
                                    <CardTitle className="text-lg font-extrabold text-stone-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-stone-600" /> Institute Pulse</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-stone-100">
                                        <div className="p-4 flex justify-between items-center hover:bg-stone-50/50">
                                            <span className="text-sm font-bold text-stone-500">Average Rating</span>
                                            <span className="text-sm font-black text-stone-800 flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {institute.averageRating?.toFixed(1) || "N/A"}</span>
                                        </div>
                                        <div className="p-4 flex justify-between items-center hover:bg-stone-50/50">
                                            <span className="text-sm font-bold text-stone-500">Total Reviews</span>
                                            <span className="text-sm font-black text-stone-800">{institute._count?.reviews || 0}</span>
                                        </div>
                                        <div className="p-4 flex justify-between items-center hover:bg-stone-50/50">
                                            <span className="text-sm font-bold text-stone-500">Managers Assigned</span>
                                            <span className="text-sm font-black text-stone-800">{institute._count?.managers || 0}</span>
                                        </div>
                                        <div className="p-4 flex justify-between items-center hover:bg-stone-50/50">
                                            <span className="text-sm font-bold text-stone-500">Active Students</span>
                                            <span className="text-sm font-black text-stone-800">{institute._count?.studentRecords || 0}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-stone-200 shadow-sm bg-white overflow-hidden">
                                <CardHeader className="bg-stone-50 border-b border-stone-100 pb-4">
                                    <CardTitle className="text-lg font-extrabold text-stone-800 flex items-center gap-2"><Users className="w-5 h-5 text-stone-600" /> Attached Managers</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    {institute.managers?.length > 0 ? (
                                        <ul className="space-y-4">
                                            {institute.managers.map((mgr: any) => (
                                                <li key={mgr.userId} className="flex items-center justify-between border border-stone-100 p-3 rounded-xl shadow-sm bg-stone-50/50">
                                                    <div>
                                                        <p className="text-sm font-bold text-stone-800">{mgr.user?.name || "No Name"}</p>
                                                        <p className="text-xs text-stone-500 font-medium">{mgr.user?.email}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-stone-500 italic text-center py-4">No managers assigned.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: GENERAL INFO */}
                <TabsContent value="general" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-stone-200 shadow-sm bg-white">
                            <CardHeader className="bg-stone-50 border-b border-stone-100">
                                <CardTitle className="text-lg font-extrabold text-stone-800 flex items-center gap-2"><Info className="w-5 h-5 text-stone-600" /> Public Information</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Description</h4>
                                    <p className="text-sm text-stone-700 whitespace-pre-wrap">{institute.description || "No description provided."}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                                    <div>
                                        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Established</h4>
                                        <p className="text-sm font-bold text-stone-800">{institute.establishedYear || "Unknown"}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Mode</h4>
                                        <p className="text-sm font-bold text-stone-800">{institute.mode}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Medium</h4>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {institute.mediumOfInstruction?.map((m: string) => (
                                                <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Categories</h4>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {institute.categories?.map((c: any) => (
                                                <Badge key={c.categoryId} className="text-[10px] bg-stone-800 text-stone-50">{c.category?.name}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-stone-200 shadow-sm bg-white">
                            <CardHeader className="bg-stone-50 border-b border-stone-100">
                                <CardTitle className="text-lg font-extrabold text-stone-800 flex items-center gap-2"><Briefcase className="w-5 h-5 text-stone-600" /> Facilities & Links</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Amenities</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2 text-sm text-stone-700">
                                            {institute.hasOnlineClasses ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-rose-500" />} Online Classes
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-stone-700">
                                            {institute.hasHostelFacility ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-rose-500" />} Hostel Facility
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-stone-700">
                                            {institute.hasDemoClasses ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-rose-500" />} Demo Classes
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-stone-700">
                                            {institute.hasScholarship ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-rose-500" />} Scholarships
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-stone-100 pt-4">
                                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Social & Web</h4>
                                    <div className="space-y-2 text-sm">
                                        {institute.website && <a href={institute.website} target="_blank" className="flex items-center gap-2 text-blue-600 hover:underline"><ExternalLink className="w-4 h-4" /> {institute.website}</a>}
                                        {institute.facebookUrl && <a href={institute.facebookUrl} target="_blank" className="flex items-center gap-2 text-blue-600 hover:underline"><LinkIcon className="w-4 h-4" /> Facebook Profile</a>}
                                        {institute.instagramUrl && <a href={institute.instagramUrl} target="_blank" className="flex items-center gap-2 text-pink-600 hover:underline"><LinkIcon className="w-4 h-4" /> Instagram Profile</a>}
                                        {institute.youtubeUrl && <a href={institute.youtubeUrl} target="_blank" className="flex items-center gap-2 text-red-600 hover:underline"><LinkIcon className="w-4 h-4" /> YouTube Channel</a>}
                                        {institute.telegramUrl && <a href={institute.telegramUrl} target="_blank" className="flex items-center gap-2 text-sky-500 hover:underline"><Send className="w-4 h-4" /> Telegram Channel</a>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-stone-200 shadow-sm bg-white md:col-span-2">
                            <CardHeader className="bg-stone-50 border-b border-stone-100">
                                <CardTitle className="text-lg font-extrabold text-stone-800 flex items-center gap-2">Pros & Cons</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <h4 className="text-sm font-bold text-emerald-900 mb-2">Advantages (Pros)</h4>
                                    {institute.pros?.length > 0 ? (
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-emerald-800">
                                            {institute.pros.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                        </ul>
                                    ) : <p className="text-sm italic text-emerald-700/50">None specified</p>}
                                </div>
                                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                                    <h4 className="text-sm font-bold text-rose-900 mb-2">Disadvantages (Cons)</h4>
                                    {institute.cons?.length > 0 ? (
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-rose-800">
                                            {institute.cons.map((c: string, i: number) => <li key={i}>{c}</li>)}
                                        </ul>
                                    ) : <p className="text-sm italic text-rose-700/50">None specified</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 3: BATCHES & STAFF */}
                <TabsContent value="batches">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Card className="border-stone-200 shadow-sm bg-white overflow-hidden transition-all hover:shadow-md">
                            <CardHeader className="bg-stone-50 border-b border-stone-100 pb-4">
                                <CardTitle className="text-lg font-extrabold text-stone-800 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-stone-600" /> Advanced Batch Manager
                                </CardTitle>
                                <CardDescription>Create batches, set fees and timings, and enroll specific logged-in users directly.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-stone-500 uppercase">Total Batches</span>
                                        <span className="text-3xl font-black text-stone-800">{institute._count?.batches || 0}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-sm font-bold text-stone-500 uppercase">Active Students</span>
                                        <span className="text-3xl font-black text-stone-800">{institute._count?.studentRecords || 0}</span>
                                    </div>
                                </div>
                                <Link
                                    href={`/af-ass-manage/institutes/${institute.id}/batches`}
                                    className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-900 text-stone-50 py-3 rounded-xl font-bold shadow-sm transition-all"
                                >
                                    Open Batch Manager <ArrowRight className="w-4 h-4" />
                                </Link>
                            </CardContent>
                        </Card>

                        <Card className="border-stone-200 shadow-sm bg-white overflow-hidden transition-all hover:shadow-md">
                            <CardHeader className="bg-stone-50 border-b border-stone-100 pb-4">
                                <CardTitle className="text-lg font-extrabold text-stone-800 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-stone-600" /> Faculty & Staff Directory
                                </CardTitle>
                                <CardDescription>Invite and assign logged-in users as teachers, track their subjects and verify status.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-stone-500 uppercase">Total Teachers</span>
                                        <span className="text-3xl font-black text-stone-800">{institute._count?.teacherRecords || 0}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-sm font-bold text-stone-500 uppercase">Managers</span>
                                        <span className="text-3xl font-black text-stone-800">{institute._count?.managers || 0}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Link
                                        href={`/af-ass-manage/institutes/${institute.id}/members`}
                                        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 py-3 rounded-xl font-bold shadow-sm transition-all"
                                    >
                                        Manage Members (Invites & Approvals) <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <Link
                                        href={`/af-ass-manage/institutes/${institute.id}/team`}
                                        className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-900 text-stone-50 py-3 rounded-xl font-bold shadow-sm transition-all"
                                    >
                                        Open Team/Staff Directory <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 4: MEDIA & GALLERY */}
                <TabsContent value="media">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <EditResultImages instituteId={institute.id} currentImages={institute.gallery || []} maxLimit={999} />
                        <ClassroomImages instituteId={institute.id} currentImages={institute.classroomImages || []} maxLimit={999} />
                        <EditVideoLinks instituteId={institute.id} currentVideos={institute.youtubeVideos || []} maxLimit={999} />
                    </div>
                </TabsContent>

                {/* TAB 5: DETAILS & ACHIEVEMENTS */}
                <TabsContent value="details">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <EditFAQs instituteId={institute.id} currentFAQs={institute.faqs || []} maxLimit={999} />
                        <EditAchievements instituteId={institute.id} currentAchievements={institute.achievements || []} maxLimit={999} />
                        <EditNotablePersons instituteId={institute.id} currentPersons={institute.notablepersons || []} maxLimit={999} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
