import { useState, useEffect, useCallback } from 'react';
import {
  getUserProfile,
  getWakeRecords,
  addWakeRecord,
  updateEMA,
  resetEMA,
  saveUserProfile,
} from '../store/storage';
import { UserProfile, WakeRecord } from '../types';
import { timeToMinutes, formatDate } from '../utils/ema';

export function useWakeData() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [records, setRecords] = useState<WakeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayRecorded, setTodayRecorded] = useState(false);

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([getUserProfile(), getWakeRecords()]);
    setProfile(p);
    setRecords(r);
    const today = formatDate(new Date());
    setTodayRecorded(r.some(rec => rec.date === today));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const recordWake = useCallback(async () => {
    if (!profile) return null;
    const now = new Date();
    const newMinutes = now.getHours() * 60 + now.getMinutes();
    const record = await addWakeRecord(profile.emaMinutes);
    const newEMA = await updateEMA(newMinutes);
    const updated = { ...profile, emaMinutes: newEMA };
    setProfile(updated);
    setRecords(prev => [record, ...prev]);
    setTodayRecorded(true);
    return record;
  }, [profile]);

  const resetAverage = useCallback(async () => {
    const updated = await resetEMA();
    setProfile(updated);
    setRecords([]);
    setTodayRecorded(false);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    await saveUserProfile(updated);
    setProfile(updated);
  }, [profile]);

  return { profile, records, loading, todayRecorded, recordWake, resetAverage, updateProfile, reload: load };
}
