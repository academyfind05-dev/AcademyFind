import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { formatIST } from "@/lib/utils";
import { Mail, MessageSquare, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import AdminDeleteButton from "@/components/admin/AdminDeleteButton";
import { deleteContactMessageAction } from "./actions";

export default async function ContactMessagesPage() {
    // Fetch latest 100 messages (Aap chaho toh pagination add kar sakte ho)
    const messages = await prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
    });

    const unreadCount = messages.filter((m: any) => !m.isRead).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 w-full pb-12">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="w-8 h-8 text-blue-600" /> Support Inbox
                    </h1>
                    <p className="text-slate-500 mt-1">
                        You have <span className="font-bold text-blue-600">{unreadCount} unread</span> messages out of {messages.length} total.
                    </p>
                </div>
            </div>

            {/* Inbox Table */}
            <div className="bg-white/80 backdrop-blur-xl border border-stone-100/60 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4 w-12 text-center">Status</th>
                                <th className="p-4">Sender Details</th>
                                <th className="p-4">Subject & Message snippet</th>
                                <th className="p-4">Received On</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100/50">
                            {messages.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">Your inbox is completely empty! 🎉</td>
                                </tr>
                            ) : (
                                messages.map((msg: any) => (
                                    <tr
                                        key={msg.id}
                                        className={`hover:bg-slate-50 transition-colors group ${!msg.isRead ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <td className="p-4 text-center">
                                            {msg.isRead ? (
                                                <CheckCircle2 className="w-5 h-5 text-slate-300 mx-auto" />
                                            ) : (
                                                <Circle className="w-4 h-4 fill-blue-500 text-blue-500 mx-auto animate-pulse" />
                                            )}
                                        </td>

                                        <td className="p-4">
                                            <div className={`text-slate-900 ${!msg.isRead ? 'font-bold' : 'font-medium'}`}>
                                                {msg.name}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Mail className="w-3 h-3" /> {msg.email}
                                            </div>
                                        </td>

                                        <td className="p-4 max-w-md">
                                            <div className={`truncate ${!msg.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
                                                {msg.subject || "No Subject provided"}
                                            </div>
                                            <div className="truncate text-xs text-slate-500 mt-0.5">
                                                {msg.message}
                                            </div>
                                        </td>

                                        <td className="p-4 text-slate-500 text-xs font-medium">
                                            {formatIST(msg.createdAt, "MMM dd, yyyy")} <br />
                                            <span className="text-slate-400">{formatIST(msg.createdAt, "hh:mm a")}</span>
                                        </td>

                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end">
                                                <Link
                                                    prefetch={false}
                                                    href={`/af-ass-manage/contactmessages/${msg.id}`}
                                                    className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all"
                                                >
                                                    Read <ArrowRight className="w-3 h-3 ml-1" />
                                                </Link>
                                                <AdminDeleteButton id={msg.id} onDelete={deleteContactMessageAction} title="Delete Message?" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}