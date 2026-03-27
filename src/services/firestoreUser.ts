import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type FirestoreUser = {
  uid: string;
  name: string;
  bio: string;
  bakuType: number;
  emaMinutes: number;
  recordCount: number;
  hasWokenToday: boolean;
  lastWakeDate: string;
  followingIds: string[];
  feedHues: number[];
};

const USERS = 'users';

export async function createUserInFirestore(uid: string, initial: Partial<FirestoreUser>): Promise<void> {
  const ref = doc(db, USERS, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      name: initial.name ?? 'ユーザー',
      bio: '',
      bakuType: Math.floor(Math.random() * 20) + 1,
      emaMinutes: 7 * 60,
      recordCount: 0,
      hasWokenToday: false,
      lastWakeDate: '',
      followingIds: [],
      feedHues: [],
    });
  }
}

export async function getFirestoreUser(uid: string): Promise<FirestoreUser | null> {
  const snap = await getDoc(doc(db, USERS, uid));
  return snap.exists() ? (snap.data() as FirestoreUser) : null;
}

export async function updateFirestoreUser(uid: string, data: Partial<FirestoreUser>): Promise<void> {
  await updateDoc(doc(db, USERS, uid), data as Record<string, unknown>);
}

export async function getAllUsers(): Promise<FirestoreUser[]> {
  const snap = await getDocs(collection(db, USERS));
  const users = snap.docs.map(d => d.data() as FirestoreUser);
  return users.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'ja'));
}

export async function followUserFirestore(myUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, USERS, myUid), { followingIds: arrayUnion(targetUid) });
}

export async function unfollowUserFirestore(myUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, USERS, myUid), { followingIds: arrayRemove(targetUid) });
}
