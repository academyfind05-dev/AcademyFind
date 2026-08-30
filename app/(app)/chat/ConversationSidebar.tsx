"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Hash, MessageCircle, Pin, Search, Users, ArrowLeft, UserPlus, X, Loader2, Sparkles, Check } from "lucide-react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ConversationType = "DIRECT" | "INSTITUTE" | "BATCH" | "GROUP" | "AI";

interface ConversationItem {
  id: string;
  type: ConversationType;
  displayName: string;
  displayImage: string | null;
  channelType: string | null;
  isPinned: boolean;
  lastReadAt: string | null;
  lastMessageAt: string | null;
  lastMessage: {
    content: string | null;
    type: string;
    sender: { name: string | null };
    createdAt: string;
  } | null;
  instituteId: string | null;
  dmUserId: string | null;
}

interface SearchedUser {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
  role: string;
}

export function ConversationSidebar({ userId }: { userId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"DIRECT" | "CHANNELS">("DIRECT");

  // New Chat Modal State
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<SearchedUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null);

  const { data, isLoading } = useSWR<{ conversations: ConversationItem[] }>(
    "/api/v2/conversations",
    fetcher,
    { refreshInterval: 8000 },
  );

  const conversations = data?.conversations ?? [];
  const isConversationActive = pathname !== "/chat";

  // Debounced search for new users
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setUserSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const res = await fetch(`/api/v2/users/search?q=${encodeURIComponent(userSearchQuery.trim())}`);
        const data = await res.json();
        setUserSearchResults(data.users || []);
      } catch (err) {
        console.error("Failed to search users:", err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  const handleStartDirectChat = async (targetUser: SearchedUser) => {
    setStartingChatWith(targetUser.id);
    try {
      const res = await fetch("/api/v2/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetUser.id }),
      });

      const data = await res.json();
      if (data.conversationId) {
        setIsNewChatOpen(false);
        setUserSearchQuery("");
        mutate("/api/v2/conversations");
        router.push(`/chat/${data.conversationId}`);
      } else {
        alert(data.error || "Failed to start direct conversation");
      }
    } catch (err: any) {
      alert(err.message || "Failed to start conversation");
    } finally {
      setStartingChatWith(null);
    }
  };

  const getTimestamp = (c: ConversationItem) => {
    if (c.lastMessage?.createdAt) return new Date(c.lastMessage.createdAt).getTime();
    if (c.lastMessageAt) return new Date(c.lastMessageAt).getTime();
    return 0;
  };

  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return getTimestamp(b) - getTimestamp(a);
  });

  const filtered = sortedConversations.filter((c: ConversationItem) =>
    c.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  const pinned = filtered.filter((c: ConversationItem) => c.isPinned);
  const dms = filtered.filter((c: ConversationItem) => !c.isPinned && c.type === "DIRECT");
  const channels = filtered.filter(
    (c: ConversationItem) => !c.isPinned && c.type !== "DIRECT",
  );

  return (
    <>
      <aside className={`w-full md:w-80 shrink-0 flex-col border-r border-white/20 bg-white/40 backdrop-blur-2xl transition-all duration-300 z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] ${isConversationActive ? "hidden md:flex" : "flex"}`}>
        {/* Frosted Header */}
        <div className="flex flex-col gap-3 border-b border-white/40 px-4 py-4 bg-white/50 backdrop-blur-md relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-purple-500/5 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <h2 className="text-xl font-extrabold text-slate-800 drop-shadow-sm flex items-center gap-2">
              <Link href="/" className="p-1.5 bg-white/60 hover:bg-white rounded-full text-slate-600 transition-all shadow-sm border border-white/60">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              Messages
            </h2>

            <button
              onClick={() => setIsNewChatOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-sm shadow-amber-500/30 transition-all"
              title="Message any user by name or @username"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          </div>
          
          {/* Tab Toggle */}
          <div className="flex gap-2 p-1 bg-white/40 rounded-xl shadow-inner border border-white/60 relative z-10">
              <button 
                onClick={() => setActiveTab('DIRECT')} 
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${activeTab === 'DIRECT' ? 'bg-white shadow-sm text-amber-600 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
              >
                Direct
              </button>
              <button 
                onClick={() => setActiveTab('CHANNELS')} 
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${activeTab === 'CHANNELS' ? 'bg-white shadow-sm text-amber-600 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
              >
                Channels
              </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-3 border-b border-white/30 bg-white/20">
          <div className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/50 shadow-inner px-3 py-2 text-sm text-slate-400 focus-within:border-amber-300 focus-within:bg-white focus-within:shadow-md transition-all">
            <Search className="size-4 shrink-0 text-slate-400" />
            <input
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none font-medium"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
          {isLoading && (
            <div className="px-4 py-8 text-center text-sm font-medium text-slate-400 animate-pulse">
              Loading...
            </div>
          )}

          {!isLoading && conversations.length === 0 && (
            <div className="px-4 py-8 text-center text-sm font-medium text-slate-400 bg-white/30 rounded-2xl border border-white/50 m-2">
              No conversations yet.
              <br />
              <button
                onClick={() => setIsNewChatOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" /> Message a User
              </button>
            </div>
          )}

          {pinned.length > 0 && (
            <SectionGroup label="Pinned">
              {pinned.map((c: ConversationItem) => (
                <ConvoCard key={c.id} convo={c} isActive={pathname.includes(c.id)} />
              ))}
            </SectionGroup>
          )}

          {activeTab === 'DIRECT' && dms.length > 0 && (
            <SectionGroup label="Direct Messages">
              {dms.map((c: ConversationItem) => (
                <ConvoCard key={c.id} convo={c} isActive={pathname.includes(c.id)} />
              ))}
            </SectionGroup>
          )}

          {activeTab === 'CHANNELS' && channels.length > 0 && (
            <SectionGroup label="Institute Channels">
              {channels.map((c: ConversationItem) => (
                <ConvoCard key={c.id} convo={c} isActive={pathname.includes(c.id)} />
              ))}
            </SectionGroup>
          )}
        </div>
      </aside>

      {/* 🚀 New Chat User Search Modal (for Admin, Sales Manager & Users) */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">Start Direct Chat</h3>
                  <p className="text-xs text-slate-500 font-medium">Search any user by name, @username, or email</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsNewChatOpen(false);
                  setUserSearchQuery("");
                  setUserSearchResults([]);
                }}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type name, @username, email or phone..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-slate-800 outline-none font-medium placeholder:text-slate-400"
                />
                {isSearchingUsers ? (
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                ) : userSearchQuery ? (
                  <button onClick={() => setUserSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {!userSearchQuery.trim() ? (
                <div className="py-12 text-center text-slate-400 text-sm font-medium">
                  <Search className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Type in the box above to search any user across AcademyFind.
                </div>
              ) : isSearchingUsers ? (
                <div className="py-12 text-center text-slate-400 text-sm font-medium flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-amber-500 animate-spin" /> Searching users...
                </div>
              ) : userSearchResults.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm font-medium">
                  No users found matching "{userSearchQuery}".
                </div>
              ) : (
                userSearchResults.map((user) => {
                  const isStarting = startingChatWith === user.id;

                  return (
                    <div
                      key={user.id}
                      onClick={() => !isStarting && handleStartDirectChat(user)}
                      className={`p-3 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/40 cursor-pointer flex items-center justify-between transition-all group ${
                        isStarting ? "opacity-60 pointer-events-none" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          {user.image ? (
                            <img src={user.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="flex h-full items-center justify-center font-black text-sm text-slate-500 uppercase">
                              {(user.name ?? user.username ?? "?").charAt(0)}
                            </span>
                          )}
                        </div>

                        {/* Name & Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-800 truncate group-hover:text-amber-600 transition-colors">
                              {user.name || "Unnamed User"}
                            </span>
                            {user.role && user.role !== "USER" && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                {user.role.replace("_", " ")}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                            {user.username && <span className="text-amber-600 font-medium">@{user.username}</span>}
                            {user.email && <span className="truncate">{user.email}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        disabled={isStarting}
                        className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-500 group-hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                      >
                        {isStarting ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Opening...</span>
                          </>
                        ) : (
                          <span>Chat</span>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SectionGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 mb-2">
      <p className="px-3 pb-1 pt-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400/80">
        {label}
      </p>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

function ConvoCard({
  convo,
  isActive,
}: {
  convo: ConversationItem;
  isActive: boolean;
}) {
  const hasUnread =
    !isActive &&
    convo.lastMessageAt != null &&
    (convo.lastReadAt == null ||
      new Date(convo.lastMessageAt) > new Date(convo.lastReadAt));

  return (
    <Link
      href={`/chat/${convo.id}`}
      className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
        isActive
          ? "bg-white/80 border border-white shadow-sm ring-1 ring-amber-100 scale-[1.02] z-10 relative"
          : "hover:bg-white/50 border border-transparent hover:border-white/40 hover:shadow-sm"
      }`}
    >
      {/* Avatar */}
      <div className={`relative size-11 shrink-0 overflow-hidden rounded-full shadow-inner transition-transform group-hover:scale-105 ${isActive ? 'bg-amber-100 ring-2 ring-amber-200 ring-offset-1' : 'bg-white border border-white/60'}`}>
        {convo.displayImage ? (
          <img
            src={convo.displayImage}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : convo.type === "DIRECT" ? (
          <span className="flex h-full items-center justify-center text-sm font-extrabold text-slate-500 bg-gradient-to-br from-slate-100 to-slate-200">
            {(convo.displayName ?? "?").charAt(0).toUpperCase()}
          </span>
        ) : (
          <span className="flex h-full items-center justify-center text-base bg-gradient-to-br from-amber-50 to-orange-50">
            {convo.channelType === "ANNOUNCEMENTS" ? "📢" : "#"}
          </span>
        )}
        {hasUnread && (
          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-rose-500 shadow-sm animate-pulse" />
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-1">
          <span
            className={`text-sm leading-tight line-clamp-2 break-words group-hover:text-amber-600 transition-colors ${hasUnread ? "font-extrabold text-slate-900" : "font-bold text-slate-700"}`}
          >
            {convo.displayName}
          </span>
          {hasUnread && (
            <span className="shrink-0 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
              NEW
            </span>
          )}
        </div>
        {convo.lastMessage && (
          <p
            className={`truncate text-[11px] mt-1 ${hasUnread ? "text-slate-700 font-medium" : "text-slate-500"}`}
          >
            {convo.type !== "DIRECT" &&
              convo.lastMessage?.sender.name &&
              <span className="font-semibold text-slate-600">{convo.lastMessage.sender.name.split(" ")[0]}: </span>}
            {convo.lastMessage.type === "IMAGE"
              ? "📷 Photo"
              : convo.lastMessage.type === "FILE"
              ? "📎 File"
              : (convo.lastMessage.content ?? "")}
          </p>
        )}
      </div>
    </Link>
  );
}
