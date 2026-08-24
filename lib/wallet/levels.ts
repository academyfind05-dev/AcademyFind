export type UserLevel = "Explorer" | "Learner" | "Scholar" | "Mentor" | "Champion";

export interface LevelInfo {
  name: UserLevel;
  min: number;
  max: number | null;
  description: string;
}

export const AFC_LEVELS: Record<UserLevel, LevelInfo> = {
  Explorer: {
    name: "Explorer",
    min: 0,
    max: 20,
    description: "You're just getting started. Explore, engage and earn your first rewards!",
  },
  Learner: {
    name: "Learner",
    min: 21,
    max: 50,
    description: "Keep learning and engaging. You're building great momentum!",
  },
  Scholar: {
    name: "Scholar",
    min: 51,
    max: 100,
    description: "Great going! You're becoming a trusted and active member.",
  },
  Mentor: {
    name: "Mentor",
    min: 101,
    max: 500,
    description: "You're an inspiration to others. Share, guide and make an impact!",
  },
  Champion: {
    name: "Champion",
    min: 501,
    max: null, // Infinity
    description: "You're at the top! A true champion who leads and drives the AcademyFind community.",
  }
};

export function getUserAFCLevel(lifetimeEarned: number): UserLevel {
  if (lifetimeEarned <= 20) return "Explorer";
  if (lifetimeEarned <= 50) return "Learner";
  if (lifetimeEarned <= 100) return "Scholar";
  if (lifetimeEarned <= 500) return "Mentor";
  return "Champion";
}

export function getLevelInfo(lifetimeEarned: number): LevelInfo {
  const levelName = getUserAFCLevel(lifetimeEarned);
  return AFC_LEVELS[levelName];
}
