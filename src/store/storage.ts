import AsyncStorage from '@react-native-async-storage/async-storage';
import { WakeRecord, UserProfile, FollowRelation, MockUser } from '../types';
import { formatDate, formatTime, calcEMA, timeToMinutes, calcMatchScore } from '../utils/ema';

const KEYS = {
  WAKE_RECORDS: 'wake_records',
  USER_PROFILE: 'user_profile',
  FOLLOW_RELATION: 'follow_relation',
  MOCK_USERS: 'mock_users',
};

// --- Wake Records ---

export async function getWakeRecords(): Promise<WakeRecord[]> {
  const raw = await AsyncStorage.getItem(KEYS.WAKE_RECORDS);
  return raw ? JSON.parse(raw) : [];
}

export async function addWakeRecord(emaMinutes: number): Promise<WakeRecord> {
  const now = new Date();
  const time = formatTime(now);
  const actualMinutes = timeToMinutes(time);
  const matchScore = calcMatchScore(emaMinutes, actualMinutes);
  const record: WakeRecord = {
    id: String(now.getTime()),
    date: formatDate(now),
    time,
    timestamp: now.getTime(),
    matchScore,
  };
  const records = await getWakeRecords();
  records.unshift(record);
  await AsyncStorage.setItem(KEYS.WAKE_RECORDS, JSON.stringify(records));
  return record;
}

export async function clearWakeRecords(): Promise<void> {
  await AsyncStorage.setItem(KEYS.WAKE_RECORDS, JSON.stringify([]));
}

// --- User Profile ---

const DEFAULT_PROFILE: UserProfile = {
  id: 'me',
  name: 'ユーザー',
  bio: '',
  avatarUri: null,
  bakuType: 1,
  emaMinutes: 7 * 60, // 7:00 AM default
  createdAt: Date.now(),
};

export async function getUserProfile(): Promise<UserProfile> {
  const raw = await AsyncStorage.getItem(KEYS.USER_PROFILE);
  return raw ? JSON.parse(raw) : DEFAULT_PROFILE;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function updateEMA(newMinutes: number): Promise<number> {
  const profile = await getUserProfile();
  const newEMA = calcEMA(profile.emaMinutes, newMinutes);
  profile.emaMinutes = newEMA;
  await saveUserProfile(profile);
  return newEMA;
}

export async function resetEMA(newBakuType?: number): Promise<UserProfile> {
  const profile = await getUserProfile();
  profile.emaMinutes = 7 * 60;
  if (newBakuType !== undefined) {
    profile.bakuType = newBakuType;
  } else {
    profile.bakuType = Math.floor(Math.random() * 20) + 1;
  }
  await saveUserProfile(profile);
  await clearWakeRecords();
  return profile;
}

// --- Follow Relations ---

const DEFAULT_FOLLOW: FollowRelation = {
  followingIds: [],
};

export async function getFollowRelation(): Promise<FollowRelation> {
  const raw = await AsyncStorage.getItem(KEYS.FOLLOW_RELATION);
  return raw ? JSON.parse(raw) : DEFAULT_FOLLOW;
}

export async function followUser(userId: string): Promise<void> {
  const rel = await getFollowRelation();
  if (!rel.followingIds.includes(userId)) {
    rel.followingIds.push(userId);
    await AsyncStorage.setItem(KEYS.FOLLOW_RELATION, JSON.stringify(rel));
  }
}

export async function unfollowUser(userId: string): Promise<void> {
  const rel = await getFollowRelation();
  rel.followingIds = rel.followingIds.filter(id => id !== userId);
  await AsyncStorage.setItem(KEYS.FOLLOW_RELATION, JSON.stringify(rel));
}

// --- Mock Users ---

export const MOCK_USERS: MockUser[] = [
  {
    id: 'mock1',
    name: 'はな',
    bio: '早起きしたい',
    bakuType: 3,
    hasWokenToday: false,
    emaMinutes: 6 * 60 + 30,
    recordCount: 14,
  },
  {
    id: 'mock2',
    name: 'そら',
    bio: '夢をよく見る',
    bakuType: 7,
    hasWokenToday: true,
    emaMinutes: 7 * 60 + 15,
    recordCount: 8,
  },
  {
    id: 'mock3',
    name: 'りく',
    bio: '朝活中',
    bakuType: 12,
    hasWokenToday: false,
    emaMinutes: 5 * 60 + 45,
    recordCount: 20,
  },
  {
    id: 'mock4',
    name: 'みお',
    bio: '夜型から脱出中',
    bakuType: 16,
    hasWokenToday: false,
    emaMinutes: 8 * 60,
    recordCount: 5,
  },
  {
    id: 'mock5',
    name: 'かい',
    bio: 'バク観察日記',
    bakuType: 5,
    hasWokenToday: true,
    emaMinutes: 6 * 60,
    recordCount: 11,
  },
];

export function getMockUserById(id: string): MockUser | undefined {
  return MOCK_USERS.find(u => u.id === id);
}
