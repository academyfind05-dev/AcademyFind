export type UserLevel = 'Explorer' | 'Learner' | 'Scholar' | 'Mentor' | 'Champion';

export interface LevelInfo {
  name: UserLevel;
  badge: string;
  description: string;
  min: number;
  max: number | null;
}

export function getLevelInfo(afcBalance: number): LevelInfo {
  const points = Math.max(0, afcBalance || 0);

  if (points <= 20) {
    return { name: 'Explorer', badge: '🧭', description: 'Starting your learning journey (0 - 20 AFC)', min: 0, max: 20 };
  }
  if (points <= 50) {
    return { name: 'Learner', badge: '📚', description: 'Actively discovering academies & guides (21 - 50 AFC)', min: 21, max: 50 };
  }
  if (points <= 100) {
    return { name: 'Scholar', badge: '🎓', description: 'Experienced platform reviewer & contributor (51 - 100 AFC)', min: 51, max: 100 };
  }
  if (points <= 500) {
    return { name: 'Mentor', badge: '👨‍🏫', description: 'Trusted community guide & advisor (101 - 500 AFC)', min: 101, max: 500 };
  }
  return { name: 'Champion', badge: '🏆', description: 'Top Tier AcademyFind Champion (501+ AFC)', min: 501, max: null };
}

export function getUserLevel(afcBalance: number) {
  return getLevelInfo(afcBalance);
}
