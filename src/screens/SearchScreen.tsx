import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import BakuCanvas from '../components/BakuCanvas';
import {
  getFollowRelation,
  followUser,
  unfollowUser,
  MOCK_USERS,
  getMockUserById,
} from '../store/storage';
import { MockUser, FollowRelation } from '../types';
import { minutesToTime } from '../utils/ema';

type Tab = 'search' | 'following' | 'followers';

function UserRow({
  user,
  isFollowing,
  onToggle,
}: {
  user: MockUser;
  isFollowing: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.userRow}>
      <View style={styles.bakuMini}>
        <BakuCanvas bakuType={user.bakuType} size={60} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userBio} numberOfLines={1}>{user.bio}</Text>
        <Text style={styles.userEma}>平均 {minutesToTime(user.emaMinutes)}</Text>
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
  const [relation, setRelation] = useState<FollowRelation>({ followingIds: [], followerIds: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const rel = await getFollowRelation();
    setRelation(rel);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleFollow = useCallback(async (userId: string) => {
    const isFollowing = relation.followingIds.includes(userId);
    if (isFollowing) {
      await unfollowUser(userId);
      setRelation(prev => ({ ...prev, followingIds: prev.followingIds.filter(id => id !== userId) }));
    } else {
      await followUser(userId);
      setRelation(prev => ({ ...prev, followingIds: [...prev.followingIds, userId] }));
    }
  }, [relation.followingIds]);

  const searchResults = query.trim()
    ? MOCK_USERS.filter(u => u.name.includes(query.trim()))
    : MOCK_USERS;

  const followingUsers = relation.followingIds
    .map(id => getMockUserById(id))
    .filter((u): u is MockUser => !!u);

  const followerUsers = relation.followerIds
    .map(id => getMockUserById(id))
    .filter((u): u is MockUser => !!u);

  const displayList: MockUser[] =
    tab === 'search' ? searchResults :
    tab === 'following' ? followingUsers :
    followerUsers;

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

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['search', 'following', 'followers'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'search' ? '検索' : t === 'following' ? `フォロー中 ${relation.followingIds.length}` : `フォロワー ${relation.followerIds.length}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search bar */}
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

      <FlatList
        data={displayList}
        keyExtractor={u => u.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {tab === 'search' ? '見つかりませんでした' : 'まだいません'}
          </Text>
        }
        renderItem={({ item }) => (
          <UserRow
            user={item}
            isFollowing={relation.followingIds.includes(item.id)}
            onToggle={() => handleToggleFollow(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EF',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '300',
    color: '#2A2A2A',
    letterSpacing: 2,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#EDEAE5',
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#F7F4EF',
  },
  tabText: {
    fontSize: 12,
    color: '#888',
  },
  tabTextActive: {
    color: '#2A2A2A',
    fontWeight: '500',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#FDFCF9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#E8E5E0',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  bakuMini: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    paddingHorizontal: 10,
    gap: 2,
  },
  userName: {
    fontSize: 14,
    color: '#2A2A2A',
    fontWeight: '500',
  },
  userBio: {
    fontSize: 11,
    color: '#888',
  },
  userEma: {
    fontSize: 11,
    color: '#BCBAB7',
  },
  followBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
  },
  followBtnDone: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C0BDB8',
  },
  followBtnText: {
    fontSize: 12,
    color: '#F7F4EF',
  },
  followBtnTextDone: {
    color: '#888',
  },
  emptyText: {
    textAlign: 'center',
    color: '#BCBAB7',
    fontSize: 13,
    marginTop: 40,
  },
});
