export type WakeRecord = {
  id: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  timestamp: number;
  matchScore: number; // EMAとの一致度 0.0〜1.0
};

export type UserProfile = {
  id: string;
  name: string;
  bio: string;
  avatarUri: string | null;
  bakuType: number;   // 1〜20
  emaMinutes: number; // 平均起床時刻（分換算）
  createdAt: number;
};

export type FollowRelation = {
  followingIds: string[];
  followerIds: string[];
};

export type MockUser = {
  id: string;
  name: string;
  bio: string;
  bakuType: number;
  hasWokenToday: boolean;
  emaMinutes: number;
};
