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
import { updateFirestoreUser, getFirestoreUser, createUserInFirestore } from '../services/firestoreUser';

export function useWakeData() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [records, setRecords] = useState<WakeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedHues, setFeedHues] = useState<number[]>([]);
  const [firestoreWokenToday, setFirestoreWokenToday] = useState(false);
  const [recordCount, setRecordCount] = useState(0);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    const [p, r, localHues] = await Promise.all([getUserProfile(), getWakeRecords(), getFeedHues()]);

    // Sync fields from Firestore (source of truth)
    let resolvedHues = localHues;
    if (uid) {
      let fp = await getFirestoreUser(uid);

      if (!fp) {
        // 認証済みユーザーのFirestoreドキュメントが存在しない場合（コンソールからの削除や
        // 部分的な削除失敗など）は、ローカルデータを使わず新規ドキュメントを作成して
        // クリーンな状態に戻す
        await createUserInFirestore(uid, { name: p.name });
        await saveFeedHues([]);
        resolvedHues = [];
        fp = await getFirestoreUser(uid);
      }

      if (fp) {
        p.bakuType = fp.bakuType;
        p.emaMinutes = fp.emaMinutes;
        p.name = fp.name;
        p.bio = fp.bio;

        // Sync feedHues from Firestore so self-view matches what others see
        if (fp.feedHues) {
          resolvedHues = fp.feedHues;
          await saveFeedHues(fp.feedHues);
        }

        // Reset hasWokenToday in Firestore if it's a new day
        const today = formatDate(new Date());
        if (fp.hasWokenToday && fp.lastWakeDate !== today) {
          await updateFirestoreUser(uid, { hasWokenToday: false });
          setFirestoreWokenToday(false);
        } else {
          setFirestoreWokenToday(fp.hasWokenToday && fp.lastWakeDate === today);
        }

        // Firestore recordCount is authoritative (local records are cleared on logout)
        setRecordCount(Math.max(r.length, fp.recordCount ?? 0));

        await saveUserProfile(p);
      }
    } else {
      setRecordCount(r.length);
    }

    setProfile(p);
    setRecords(r);
    setFeedHues(resolvedHues);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Add a new hue to the front of the list (newest first). Max 20 entries.
  const addFeedHue = useCallback((hue: number) => {
    setFeedHues(prev => {
      const newHues = [hue, ...prev].slice(0, 100);
      saveFeedHues(newHues); // persist async, fire and forget
      const uid = auth.currentUser?.uid;
      if (uid) updateFirestoreUser(uid, { feedHues: newHues }); // sync to Firestore
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
    setRecordCount(prev => prev + 1);
    setFirestoreWokenToday(true);
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
        feedHues: [],
      });
    }

    setProfile(updated);
    setRecords([]);
    setFeedHues([]);
    setRecordCount(0);
    setFirestoreWokenToday(false);
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

  const todayRecorded = firestoreWokenToday || records.some(rec => rec.date === formatDate(new Date()));

  return { profile, records, recordCount, loading, todayRecorded, feedHues, addFeedHue, recordWake, resetAverage, updateProfile, reload: load };
}
