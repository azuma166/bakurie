/**
 * モックユーザーを Firestore に投入するスクリプト。
 * かけらが複数枚ある状態の表示確認に使う。
 *
 * 実行: node scripts/seedMockUsers.mjs
 * 削除: node scripts/seedMockUsers.mjs --delete
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ランダムなhue配列を生成（seedで再現可能）
function makeHues(count, seedBase) {
  const hues = [];
  for (let i = 0; i < count; i++) {
    // 決定的な疑似乱数（seedベース）
    const x = Math.sin((seedBase + i) * 9301 + 49297) * 233280;
    hues.push((x - Math.floor(x)) * 360);
  }
  return hues;
}

// 今日の日付（YYYY-MM-DD）
const today = new Date().toISOString().slice(0, 10);

const MOCK_USERS = [
  {
    uid: 'mock-yuki',
    name: 'ゆき',
    bio: '最近バクを飼い始めました',
    bakuType: 3,
    emaMinutes: 7 * 60,       // 7:00
    recordCount: 2,
    hasWokenToday: false,
    lastWakeDate: '',
    followingIds: [],
    feedHues: makeHues(2, 10), // かけら2枚
  },
  {
    uid: 'mock-haruto',
    name: 'はると',
    bio: '早起き練習中',
    bakuType: 7,
    emaMinutes: 6 * 60 + 30,  // 6:30
    recordCount: 6,
    hasWokenToday: true,
    lastWakeDate: today,
    followingIds: [],
    feedHues: makeHues(6, 42), // かけら6枚
  },
  {
    uid: 'mock-sora',
    name: 'そら',
    bio: '夢をよく見る。バクに食べてもらってる',
    bakuType: 12,
    emaMinutes: 5 * 60 + 45,  // 5:45
    recordCount: 15,
    hasWokenToday: false,
    lastWakeDate: today,
    followingIds: [],
    feedHues: makeHues(15, 99), // かけら15枚
  },
  {
    uid: 'mock-rin',
    name: 'りん',
    bio: '',
    bakuType: 2,
    emaMinutes: 8 * 60,       // 8:00
    recordCount: 28,
    hasWokenToday: true,
    lastWakeDate: today,
    followingIds: [],
    feedHues: makeHues(28, 7), // かけら28枚
  },
  {
    uid: 'mock-kaito',
    name: 'かいと',
    bio: '毎朝5時に起きるのが目標',
    bakuType: 17,
    emaMinutes: 5 * 60,       // 5:00
    recordCount: 50,
    hasWokenToday: false,
    lastWakeDate: '',
    followingIds: [],
    feedHues: makeHues(50, 333), // かけら50枚（満載）
  },
];

const shouldDelete = process.argv.includes('--delete');

if (shouldDelete) {
  console.log('=== モックユーザー削除 ===');
  for (const u of MOCK_USERS) {
    await db.collection('users').doc(u.uid).delete();
    console.log(`削除: ${u.name} (${u.uid})`);
  }
} else {
  console.log('=== モックユーザー投入 ===');
  for (const u of MOCK_USERS) {
    await db.collection('users').doc(u.uid).set(u);
    console.log(`投入: ${u.name} (${u.uid}) — かけら ${u.recordCount}枚`);
  }
}

console.log('=== 完了 ===');
