import { useState, useEffect, useCallback } from 'react';
import {
  getUserProfile,
  getWakeRecords,
  addWakeRecord,
  updateEMA,
  resetEMA,
  saveUserProfile,
  getFeedHues,
  saveFeedHues,
} from '../store/storage';
import { UserProfile, WakeRecord } from '../types';
import { timeToMinutes, formatDate } from '../utils/ema';
import { auth } from '../config/firebase';
import { updateFirestoreUser, getFirestoreUser } from '../services/firestoreUser';

export function useWakeData() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [records, setRecords] = useState<WakeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayRecorded, setTodayRecorded] = useState(false);
  const [feedHues, setFeedHues] = useState<number[]>([]);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    const [p, r, hues] = await Promise.all([getUserProfile(), getWakeRecords(), getFeedHues()]);

    // Sync bakuType and emaMinutes from Firestore if available
    if (uid) {
      const fp = await getFirestoreUser(uid);
      if (fp) {
        p.bakuType = fp.bakuType;
        p.emaMinutes = fp.emaMinutes;
        p.name = fp.name;
        p.bio = fp.bio;
        await saveUserProfile(p);
      }
    }

    setProfile(p);
    setRecords(r);
    setFeedHues(hues);
    const today = formatDate(new Date());
    setTodayRecorded(r.some(rec => rec.date === today));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Add a new hue to the front of the list (newest first). Max 20 entries.
  const addFeedHue = useCallback((hue: number) => {
    setFeedHues(prev => {
      const newHues = [hue, ...prev].slice(0, 20);
      saveFeedHues(newHues); // persist async, fire and forget
      return newHues;
    });
  }, []);

  const recordWake = useCallback(async () => {
    if (!profile) return null;
    const now = new Date();
    const newMinutes = now.getHours() * 60 + now.getMinutes();
    const record = await addWakeRecord(profile.emaMinutes);
    const newEMA = await updateEMA(newMinutes);
    const today = formatDate(now);
    const newRecords = await getWakeRecords();
    const updated = { ...profile, emaMinutes: newEMA };

    // Sync to Firestore
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateFirestoreUser(uid, {
        emaMinutes: newEMA,
        recordCount: newRecords.length,
        hasWokenToday: true,
        lastWakeDate: today,
      });
    }

    setProfile(updated);
    setRecords(prev => [record, ...prev]);
    setTodayRecorded(true);
    return record;
  }, [profile]);

  const resetAverage = useCallback(async () => {
    const updated = await resetEMA(); // also clears FEED_HUES in storage

    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateFirestoreUser(uid, {
        bakuType: updated.bakuType,
        emaMinutes: updated.emaMinutes,
        recordCount: 0,
        hasWokenToday: false,
        lastWakeDate: '',
      });
    }

    setProfile(updated);
    setRecords([]);
    setFeedHues([]);
    setTodayRecorded(false);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    await saveUserProfile(updated);

    const uid = auth.currentUser?.uid;
    if (uid) {
      const fsUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) fsUpdates.name = updates.name;
      if (updates.bio !== undefined) fsUpdates.bio = updates.bio;
      if (updates.bakuType !== undefined) fsUpdates.bakuType = updates.bakuType;
      if (Object.keys(fsUpdates).length > 0) {
        await updateFirestoreUser(uid, fsUpdates);
      }
    }

    setProfile(updated);
  }, [profile]);

  return { profile, records, loading, todayRecorded, feedHues, addFeedHue, recordWake, resetAverage, updateProfile, reload: load };
}
