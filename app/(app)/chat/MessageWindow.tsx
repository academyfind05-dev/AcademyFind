"use client";

import {
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import {
  ArrowLeft,
  CheckCheck,
  ChevronDown,
  Loader2,
  MoreVertical,
  Pin,
  Send,
  Smile,
  Trash2,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";

import { sendMessage, deleteMessage, addReaction, reportMessage } from "@/app/(app)/chat/actions";
import { ChatInfoSidebar } from "@/app/(app)/chat/components/ChatInfoSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, MessageCircle as MessageCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const POLL_INTERVAL = 5000; // 5 seconds

interface Message {
  id: string;
  content: string | null;
  type: string;
  isEdited: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
  replyToId: string | null;
  replyTo: { id: string; content: string | null; sender: { name: string | null } } | null;
  sender: { id: string; name: string | null; username: string | null; image: string | null };
  reactions: { id: string; emoji: string; userId: string; user: { name: string | null } }[];
  attachments: { id: string; fileUrl: string; fileName: string; mimeType: string; size: number }[];
}

interface ConversationMeta {
  id: string;
  type: string;
  title: string | null;
  channelType: string | null;
  isReadOnly: boolean;
  currentUserCanBypassReadOnly?: boolean;
  memberCount: number;
  institute: { id: string; name: string; logo: string | null; slug: string } | null;
  participants: { user: { id: string; name: string | null; username: string | null; image: string | null } }[];
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "🔥", "✅"];

export function MessageWindow({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: metaData } = useSWR<{ conversation: ConversationMeta }>(
    `/api/v2/conversations/${conversationId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data, mutate: mutateMessages } = useSWR<{
    messages: Message[];
    nextCursor: string | null;
  }>(`/api/v2/conversations/${conversationId}/messages`, fetcher, {
    refreshInterval: POLL_INTERVAL,
  });

  const meta = metaData?.conversation;
  const messages = data?.messages ?? [];

  // Instantly mark read in sidebar cache when conversation opens
  useEffect(() => {
    mutate("/api/v2/conversations");
  }, [conversationId, messages.length]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      setShowScrollBtn(true);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 300);
  };

  const handleSend = async () => {
    if (!content.trim() || sending) return;
    setSending(true);

    const fd = new FormData();
    fd.append("content", content.trim());
    if (replyTo) fd.append("replyToId", replyTo.id);

    const result = await sendMessage(conversationId, fd);
    if (result.success) {
      setContent("");
      setReplyTo(null);
      await mutateMessages();
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async (msgId: string) => {
    await deleteMessage(msgId);
    mutateMessages();
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    await addReaction(msgId, emoji);
    mutateMessages();
  };

  const handleReport = async (msgId: string) => {
    await reportMessage(msgId, "SPAM");
  };

  // ── Render ──────────────────────────────────────────────
  const otherParticipant = meta?.participants?.find((p: { user: { id: string } }) => p.user.id !== currentUserId) ?? meta?.participants?.[0];

  const headerTitle =
    meta?.type === "DIRECT"
      ? (otherParticipant?.user.name ?? "Direct Message")
      : (meta?.title ?? `#${meta?.channelType?.toLowerCase() ?? "channel"}`);

  const headerSub =
    meta?.type === "DIRECT"
      ? `@${otherParticipant?.user.username}`
      : (meta?.institute ? `${meta.institute.name} • ` : "") + `${meta?.memberCount ?? 0} members`;

  const headerImg =
    meta?.type === "DIRECT"
      ? (otherParticipant?.user.image ?? null)
      : (meta?.institute?.logo ?? null);

  const isReadOnly = (meta?.isReadOnly ?? false) && !(meta?.currentUserCanBypassReadOnly);

  return (
    <div className="flex flex-1 flex-col h-full bg-slate-50/20 backdrop-blur-3xl relative">
      <div className="absolute inset-0 bg-white/40 pointer-events-none" />
      {/* Frosted Header */}
      <div className="flex items-center gap-3 border-b border-white/40 bg-white/60 backdrop-blur-xl px-5 py-3 relative z-10 shadow-sm">
        <Link href="/chat" className="text-slate-500 hover:text-slate-800 md:hidden bg-white/50 p-2 rounded-full shadow-inner border border-white/60 transition-all hover:scale-105">
          <ArrowLeft className="size-5" />
        </Link>
        <ChatInfoSidebar conversationId={conversationId} meta={meta}>
          <button className="flex-1 flex items-center gap-3 text-left hover:bg-white/40 p-1.5 -ml-1.5 rounded-2xl transition-colors min-w-0">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-white shadow-inner border border-white/80">
              {headerImg ? (
                <Image src={headerImg} alt="" fill className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-sm font-extrabold text-slate-500 bg-gradient-to-br from-slate-100 to-slate-200">
                  {(headerTitle ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-extrabold text-slate-800 drop-shadow-sm">{headerTitle}</p>
              <p className="text-xs text-slate-500 font-medium">{headerSub}</p>
            </div>
          </button>
        </ChatInfoSidebar>
        
        <div className="flex items-center gap-3 shrink-0">
          {meta?.type !== "DIRECT" && meta?.institute && (
            <Link
              href={`/institute/${meta.institute.id}-${meta.institute.slug}`}
              className="text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-white/50 px-3 py-1.5 rounded-full shadow-sm border border-white/60 hidden sm:block transition-all hover:bg-white"
            >
              View Institute →
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-4 py-4 z-10 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
            No messages yet. Say hello! 👋
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg: any, i: number) => {
              const prev = messages[i - 1];
              const isSameUser = prev?.sender.id === msg.sender.id;
              const showDate =
                !prev ||
                new Date(msg.createdAt).toDateString() !==
                new Date(prev.createdAt).toDateString();
              const isMine = msg.sender.id === currentUserId;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
                      <div className="h-px flex-1 bg-slate-200" />
                      {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                  )}
                  <MessageBubble
                    msg={msg}
                    isMine={isMine}
                    isSameUser={isSameUser && !showDate}
                    currentUserId={currentUserId}
                    onReply={() => setReplyTo(msg)}
                    onDelete={() => handleDelete(msg.id)}
                    onReaction={(emoji) => handleReaction(msg.id, emoji)}
                    onReport={() => handleReport(msg.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-6 right-6 rounded-full border border-white/60 bg-white/80 p-3 shadow-lg backdrop-blur-md hover:scale-110 transition-transform z-20"
          >
            <ChevronDown className="size-5 text-amber-600 drop-shadow-sm" />
          </button>
        )}
      </div>

      {/* Input bar */}
      {!isReadOnly ? (
        <div className="border-t border-white/40 bg-white/60 backdrop-blur-xl px-4 py-3 relative z-10 shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.1)]">
          {/* Reply preview */}
          {replyTo && (
            <div className="mb-2 flex items-start gap-2 rounded-xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-md px-3 py-2 text-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
              <div className="flex-1 truncate pl-1">
                <span className="font-bold text-amber-700 drop-shadow-sm">
                  Replying to {replyTo.sender.name}
                </span>
                <p className="truncate text-slate-500 font-medium mt-0.5">{replyTo.content}</p>
              </div>
              <button type="button" onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-700 bg-white/50 rounded-full p-1 transition-colors">
                ✕
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type a message..."
              className="flex-1 resize-none rounded-2xl border border-white/60 bg-white/70 shadow-inner px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100/50 max-h-32 overflow-y-auto transition-all custom-scrollbar"
              style={{ height: "auto" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 128) + "px";
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!content.trim() || sending}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-900 shadow-md hover:bg-amber-500 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 transition-all border border-amber-300"
            >
              {sending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Send className="size-5 drop-shadow-sm ml-0.5" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-white/40 bg-white/60 backdrop-blur-xl px-4 py-4 text-center text-sm font-bold text-slate-500 relative z-10 shadow-inner">
          🔒 This channel is read-only.
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  isMine,
  isSameUser,
  currentUserId,
  onReply,
  onDelete,
  onReaction,
  onReport,
}: {
  msg: Message;
  isMine: boolean;
  isSameUser: boolean;
  currentUserId: string;
  onReply: () => void;
  onDelete: () => void;
  onReaction: (emoji: string) => void;
  onReport: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const isDeleted = msg.content === "[Message deleted]";

  return (
    <div
      className={`group flex gap-2 ${isMine ? "flex-row-reverse" : ""} ${isSameUser ? "mt-0.5" : "mt-3"
        }`}
    >
      {/* Avatar */}
      {!isSameUser ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`relative size-8 shrink-0 overflow-hidden rounded-full bg-slate-100 mt-1 hover:ring-2 hover:ring-amber-200 transition-all ${isMine ? "hidden" : ""}`}>
              {msg.sender.image ? (
                <img src={msg.sender.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xs font-bold text-slate-400">
                  {(msg.sender.name ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border-white/60 p-2">
            <div className="px-2 py-1.5 text-sm font-bold text-slate-800">
              {msg.sender.name}
              <p className="text-[10px] font-medium text-slate-500 font-mono">@{msg.sender.username}</p>
            </div>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem asChild className="rounded-lg cursor-pointer hover:bg-amber-50 hover:text-amber-700">
              <Link href={`/profile/${msg.sender.username}`}>
                <User className="mr-2 h-4 w-4" />
                <span>View Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg cursor-pointer hover:bg-amber-50 hover:text-amber-700">
              <Link href={`/chat?userId=${msg.sender.id}`}>
                <MessageCircleIcon className="mr-2 h-4 w-4" />
                <span>Message</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="w-8 shrink-0" />
      )}

      <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
        {/* Name + time */}
        {!isSameUser && !isMine && (
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-xs font-semibold text-slate-700">
              {msg.sender.name ?? msg.sender.username}
            </span>
            <span className="text-[10px] text-slate-400">
              {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Reply preview */}
        {msg.replyTo && (
          <div className="mb-1 rounded-lg border-l-4 border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-500">
            <span className="font-semibold">{msg.replyTo.sender.name}: </span>
            {msg.replyTo.content?.slice(0, 80)}
          </div>
        )}

        {/* Bubble + Actions Row */}
        <div className={`flex items-center gap-1.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
          {/* Bubble */}
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm border transition-all duration-300 hover:shadow-md ${isDeleted
              ? "bg-white/40 backdrop-blur-sm border-white/60 text-slate-400 italic"
              : isMine
                ? "bg-gradient-to-br from-amber-400 to-amber-500 border-amber-300/50 text-amber-950 font-medium drop-shadow-sm rounded-tr-sm"
                : "bg-white/80 backdrop-blur-md border-white/80 text-slate-800 font-medium rounded-tl-sm"
              }`}
          >
            {/* Readability Film for text contrast */}
            <span className="relative z-10 leading-relaxed">
              {msg.content}
            </span>
            {msg.isEdited && !isDeleted && (
              <span className="ml-2 text-[10px] opacity-60 font-bold">(edited)</span>
            )}
          </div>

          {/* Hover actions (Row-level group hover ensures toolbar stays open while cursor moves to it) */}
          {!isDeleted && (
            <div
              className={`flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm px-2 py-1 transition-all duration-200 ${
                showReactions
                  ? "opacity-100 z-20 pointer-events-auto scale-100"
                  : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto scale-95 group-hover:scale-100"
              }`}
            >
              {/* Emoji picker toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactions((v) => !v);
                  }}
                  className="text-slate-400 hover:text-amber-600 p-0.5 transition-colors"
                >
                  <Smile className="size-4" />
                </button>
                {showReactions && (
                  <div
                    className={`absolute bottom-8 ${isMine ? "right-0" : "left-0"} flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-150`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {QUICK_REACTIONS.map((e: string) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => { onReaction(e); setShowReactions(false); }}
                        className="text-lg hover:scale-125 transition-transform px-1 py-0.5 active:scale-95"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onReply}
                className="text-slate-400 hover:text-blue-600 p-0.5 text-xs transition-colors font-bold"
                title="Reply"
              >
                ↩
              </button>
              {isMine && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="text-slate-400 hover:text-rose-500 p-0.5 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
              {!isMine && (
                <button
                  type="button"
                  onClick={onReport}
                  className="text-slate-400 hover:text-rose-500 p-0.5 transition-colors"
                  title="Report"
                >
                  <AlertTriangle className="size-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reactions */}
        {msg.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(
              msg.reactions.reduce(
                (acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
                  return acc;
                },
                {} as Record<string, number>,
              ),
            ).map(([emoji, count]) => {
              const reacted = msg.reactions.some(
                (r) => r.emoji === emoji && r.userId === currentUserId,
              );
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReaction(emoji)}
                  className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs ${reacted
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  {emoji} {count}
                </button>
              );
            })}
          </div>
        )}

        {/* Time for own messages */}
        {isMine && !isSameUser && (
          <span className="mt-1 text-[10px] text-slate-400">
            {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
