import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();

const TARGET_EMAILS = [
  'azumaazuma06@gmail.com',
  'hiromu.aduma0103@gmail.com',
  'mirintarisuman@gmail.com',
];

async function deleteUserByEmail(email) {
  let uid;
  try {
    const user = await auth.getUserByEmail(email);
    uid = user.uid;
    console.log(`[${email}] UID: ${uid}`);
  } catch (e) {
    console.log(`[${email}] Authに存在しない: ${e.message}`);
    return;
  }

  // Firestoreのusersドキュメントを削除
  try {
    await db.collection('users').doc(uid).delete();
    console.log(`[${email}] Firestoreドキュメント削除完了`);
  } catch (e) {
    console.log(`[${email}] Firestore削除エラー: ${e.message}`);
  }

  // Authenticationのユーザーを削除
  try {
    await auth.deleteUser(uid);
    console.log(`[${email}] Authentication削除完了`);
  } catch (e) {
    console.log(`[${email}] Auth削除エラー: ${e.message}`);
  }
}

console.log('=== ユーザー削除開始 ===');
for (const email of TARGET_EMAILS) {
  await deleteUserByEmail(email);
}
console.log('=== 完了 ===');
