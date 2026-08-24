import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, MessageCircle, Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import extractId from "@/lib/extractId";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ idSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { idSlug } = await params;
  const id = extractId(idSlug);
  const institute = await prisma.institute.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!institute) return { title: "Not found" };
  return {
    title: `Member Directory — ${institute.name} | AcademyFind`,
    robots: { index: false, follow: true },
  };
}

export default async function MembersDirectoryPage({ params }: Props) {
  const { idSlug } = await params;
  const id = extractId(idSlug);

  const institute = await prisma.institute.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  });
  if (!institute) notFound();

  const [students, teachers, managers] = await Promise.all([
    prisma.studentInstituteRecord.findMany({
      where: {
        instituteId: id,
        isVerified: true,
        isVisible: true,
        membership: { status: "ACTIVE" },
      },
      take: 48,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        courseName: true,
        batchYear: true,
        bio: true,
        isVerified: true,
        studentProfile: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                allowDms: true,
              },
            },
          },
        },
        membership: {
          select: { joinedViaAcademyFind: true }
        }
      },
    }),
    prisma.teacherInstituteRecord.findMany({
      where: {
        instituteId: id,
        isVerified: true,
        isVisible: true,
        membership: { status: "ACTIVE" },
      },
      orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }],
      take: 48,
      select: {
        id: true,
        designation: true,
        teachingSubjects: true,
        isFeatured: true,
        isVerified: true,
        bio: true,
        teacherProfile: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                allowDms: true,
              },
            },
          },
        },
      },
    }),
    prisma.instituteManager.findMany({
      where: { instituteId: id },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            allowDms: true,
          },
        },
      },
    }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      {/* Header */}
      <Link
        href={`/institute/${institute.id}-${institute.slug}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" /> Back to {institute.name}
      </Link>

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-950">
          {institute.name} — Member Directory
        </h1>
        <p className="mt-1 text-slate-500">
          Verified members of this institute
        </p>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="mb-8 w-full max-w-md grid grid-cols-3 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="students" className="rounded-lg">Students ({students.length})</TabsTrigger>
          <TabsTrigger value="teachers" className="rounded-lg">Faculty ({teachers.length})</TabsTrigger>
          <TabsTrigger value="managers" className="rounded-lg">Managers ({managers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-0">
          {students.length === 0 ? (
            <EmptyState text="No verified students yet." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {students.map((record: any) => {
                const user = record.studentProfile?.user;
                if (!user) return null;
                return (
                  <MemberCard
                    key={record.id}
                    user={user}
                    subtitle={[
                      record.courseName,
                      record.batchYear ? `${record.batchYear} Batch` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    bio={record.bio}
                    isVerified={record.isVerified}
                    isAcademyFindJoin={record.membership?.joinedViaAcademyFind}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="teachers" className="mt-0">
          {teachers.length === 0 ? (
            <EmptyState text="No verified faculty yet." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((record: any) => {
                const user = record.teacherProfile?.user;
                if (!user) return null;
                return (
                  <MemberCard
                    key={record.id}
                    user={user}
                    subtitle={record.designation ?? "Faculty"}
                    bio={
                      record.teachingSubjects.length > 0
                        ? record.teachingSubjects.join(", ")
                        : record.bio
                    }
                    isVerified={record.isVerified}
                    isFeatured={record.isFeatured}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="managers" className="mt-0">
          {managers.length === 0 ? (
            <EmptyState text="No managers found." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {managers.map(({ user }: { user: any }) => (
                <MemberCard
                  key={user.id}
                  user={user}
                  subtitle="Institute Manager"
                  isVerified
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

function MemberCard({
  user,
  subtitle,
  bio,
  isVerified,
  isFeatured,
  isAcademyFindJoin,
}: {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    allowDms: boolean;
  };
  subtitle?: string | null;
  bio?: string | null;
  isVerified?: boolean;
  isFeatured?: boolean;
  isAcademyFindJoin?: boolean;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-slate-100">
          {user.image ? (
            <Image src={user.image} alt="" fill className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-lg font-bold text-slate-400">
              {(user.name ?? "U").charAt(0).toUpperCase()}
            </span>
          )}
          {isAcademyFindJoin && (
            <div className="absolute top-0 right-0 bg-amber-500 rounded-bl-xl p-0.5 shadow-sm border border-amber-600 z-10 flex items-center justify-center" title="Joined via AcademyFind">
              <span className="text-[8px] font-black text-white leading-none px-0.5">AF</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/u/${user.username}`}
            className="block truncate font-semibold text-slate-900 hover:text-amber-700"
          >
            {user.name ?? user.username}
          </Link>
          {subtitle && (
            <p className="truncate text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {isVerified && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            <BadgeCheck className="size-3" /> Verified
          </span>
        )}
        {isFeatured && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            <Star className="size-3 fill-amber-400" /> Featured
          </span>
        )}
      </div>

      {bio && (
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
          {bio}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        {user.allowDms && (
          <Link
            href={`/chat?userId=${user.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
          >
            <MessageCircle className="size-3.5" /> Message
          </Link>
        )}
        <Link
          href={`/u/${user.username}`}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          View profile →
        </Link>
      </div>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
      {text}
    </div>
  );
}
