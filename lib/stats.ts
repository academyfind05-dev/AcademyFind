import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export interface PlatformStats {
  instituteCount: number;
  cityCount: number;
  avgRating: number;
}

export const getPlatformStats = unstable_cache(
  async (): Promise<PlatformStats> => {
    try {
      const [instituteStats, cityCount] = await Promise.all([
        prisma.institute.aggregate({
          where: { isActive: true },
          _count: { id: true },
          _avg: { googleRating: true },
        }),
        prisma.city.count({
          where: { institutes: { some: { isActive: true } } },
        }),
      ]);

      const instituteCount = instituteStats._count.id || 0;
      const rawAvg = instituteStats._avg.googleRating;
      const avgRating = rawAvg ? Number(rawAvg.toFixed(1)) : 4.6;

      return {
        instituteCount,
        cityCount: cityCount || 0,
        avgRating,
      };
    } catch (error) {
      console.error("Failed to fetch platform stats:", error);
      return {
        instituteCount: 41000,
        cityCount: 9,
        avgRating: 4.6,
      };
    }
  },
  ["platform-stats"],
  { revalidate: 300, tags: ["platform-stats", "institutes"] }
);
