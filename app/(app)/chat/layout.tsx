import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

import { ConversationSidebar } from "./ConversationSidebar";

export const metadata: Metadata = {
  title: "Chat | AcademyFind",
  robots: { index: false, follow: false },
};

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-slate-50 relative">
      {/* Heavy Glass Backdrop for the entire workspace */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-amber-500/10 pointer-events-none" />
      
      {/* Sidebar */}
      <ConversationSidebar userId={session.user.id} userRole={session.user.role} />

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden relative z-10 w-full h-full">
        {children}
      </main>
    </div>
  );
}
