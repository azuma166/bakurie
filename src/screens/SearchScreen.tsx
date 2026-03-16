import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import BakuCanvas from '../components/BakuCanvas';
import {
  getAllUsers,
  followUserFirestore,
  unfollowUserFirestore,
  getFirestoreUser,
  FirestoreUser,
} from '../services/firestoreUser';
import { auth } from '../config/firebase';
import { minutesToTime } from '../utils/ema';
import { generateFragments } from '../utils/fragments';

type Tab = 'search' | 'following';

function UserRow({
  user,
  isFollowing,
  onToggle,
}: {
  user: FirestoreUser;
  isFollowing: boolean;
  onToggle: () => void;
}) {
  const fragments = React.useMemo(
    () => generateFragments(Math.min(user.recordCount, 20)),
    [user.recordCount]
  );
  return (
    <View style={styles.userRow}>
      <View style={styles.bakuMini}>
        <BakuCanvas bakuType={user.bakuType} size={56} fragments={fragments} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        {user.bio ? <Text style={styles.userBio} numberOfLines={1}>{user.bio}</Text> : null}
        <Text style={styles.userEma}>平均 {minutesToTime(user.emaMinutes)}</Text>
        <Text style={styles.userRecord}>{user.recordCount}日記録</Text>
      </View>
      <TouchableOpacity
        style={[styles.followBtn, isFollowing && styles.followBtnDone]}
        onPress={onToggle}
      >
        <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextDone]}>
          {isFollowing ? 'フォロー中' : 'フォロー'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SearchScreen() {
  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [allUsers, setAllUsers] = useState<FirestoreUser[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const myUid = auth.currentUser?.uid ?? '';

  const load = useCallback(async () => {
    const [users, me] = await Promise.all([
      getAllUsers(),
      myUid ? getFirestoreUser(myUid) : Promise.resolve(null),
    ]);
    // exclude self
    setAllUsers(users.filter(u => u.uid !== myUid));
    setFollowingIds(me?.followingIds ?? []);
    setLoading(false);
  }, [myUid]);

  useEffect(() => { load(); }, [load]);

  const handleToggleFollow = useCallback(async (targetUid: string) => {
    if (!myUid) return;
    const isFollowing = followingIds.includes(targetUid);
    if (isFollowing) {
      await unfollowUserFirestore(myUid, targetUid);
      setFollowingIds(prev => prev.filter(id => id !== targetUid));
    } else {
      await followUserFirestore(myUid, targetUid);
      setFollowingIds(prev => [...prev, targetUid]);
    }
  }, [myUid, followingIds]);

  const normalizedQuery = query.trim().toLowerCase();
  const searchResults = normalizedQuery
    ? allUsers.filter(u => u.name.toLowerCase().includes(normalizedQuery))
    : allUsers;

  const followingUsers = allUsers.filter(u => followingIds.includes(u.uid));

  const displayList = tab === 'search' ? searchResults : followingUsers;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#2A2A2A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>検索・フォロー</Text>
      </View>

      <View style={styles.tabs}>
        {(['search', 'following'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'search' ? '検索' : `フォロー中 ${followingIds.length}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'search' && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="ユーザー名で検索"
            placeholderTextColor="#BCBAB7"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.list}>
        {displayList.length === 0 ? (
          <Text style={styles.emptyText}>
            {tab === 'search' ? '見つかりませんでした' : 'まだいません'}
          </Text>
        ) : (
          displayList.map(item => (
            <UserRow
              key={item.uid}
              user={item}
              isFollowing={followingIds.includes(item.uid)}
              onToggle={() => handleToggleFollow(item.uid)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4EF' },
  header: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '300', color: '#2A2A2A', letterSpacing: 2 },
  tabs: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, backgroundColor: '#EDEAE5', padding: 3,
  },
  tab: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#F7F4EF' },
  tabText: { fontSize: 12, color: '#888' },
  tabTextActive: { color: '#2A2A2A', fontWeight: '500' },
  searchBar: { marginHorizontal: 16, marginBottom: 8 },
  searchInput: {
    backgroundColor: '#FDFCF9', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#2A2A2A',
    borderWidth: 1, borderColor: '#E8E5E0',
  },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  userRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0EDE8',
  },
  bakuMini: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1, paddingHorizontal: 10, gap: 2 },
  userName: { fontSize: 14, color: '#2A2A2A', fontWeight: '500' },
  userBio: { fontSize: 11, color: '#888' },
  userEma: { fontSize: 11, color: '#BCBAB7' },
  userRecord: { fontSize: 10, color: '#C0BDB8' },
  followBtn: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 16, backgroundColor: '#2A2A2A',
  },
  followBtnDone: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#C0BDB8' },
  followBtnText: { fontSize: 12, color: '#F7F4EF' },
  followBtnTextDone: { color: '#888' },
  emptyText: { textAlign: 'center', color: '#BCBAB7', fontSize: 13, marginTop: 40 },
});
