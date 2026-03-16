import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import BakuCanvas from '../components/BakuCanvas';
import { getAllUsers, getFirestoreUser, FirestoreUser } from '../services/firestoreUser';
import { auth } from '../config/firebase';
import { minutesToTime } from '../utils/ema';
import { generateFragments } from '../utils/fragments';

/** ダイヤモンドドット（各ユーザーのかけら色パレット） */
function FragmentDots({ hues, max = 5 }: { hues: number[]; max?: number }) {
  if (hues.length === 0) return null;
  return (
    <View style={dotStyles.row}>
      {hues.slice(0, max).map((hue, i) => (
        <View
          key={i}
          style={[dotStyles.dot, { backgroundColor: `hsl(${hue}, 55%, 68%)` }]}
        />
      ))}
    </View>
  );
}
const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, justifyContent: 'center', marginTop: 5, flexWrap: 'wrap' },
  dot: { width: 6, height: 6, transform: [{ rotate: '45deg' }] },
});

// -----------------------------------

function BakuCard({ user }: { user: FirestoreUser }) {
  const hues = user.feedHues ?? [];

  const fragments = React.useMemo(
    () => generateFragments(Math.min(user.recordCount, 20), hues),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user.recordCount, user.uid, user.feedHues]
  );

  const borderColor = hues.length > 0 ? `hsl(${hues[0]}, 40%, 82%)` : '#E8E5E0';

  return (
    <View style={[styles.card, { borderColor }, user.hasWokenToday && styles.cardWoken]}>
      <View style={styles.bakuThumb}>
        <BakuCanvas bakuType={user.bakuType} size={64} fragments={fragments} />
      </View>
      <FragmentDots hues={hues} max={5} />
      <Text style={[styles.cardName, user.hasWokenToday && styles.cardNameWoken]}>
        {user.name}
      </Text>
      <Text style={styles.cardEma}>{minutesToTime(user.emaMinutes)}</Text>
      {user.hasWokenToday && (
        <Text style={styles.wokeLabel}>起きた</Text>
      )}
    </View>
  );
}

export default function PlazaScreen() {
  const [followingUsers, setFollowingUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const myUid = auth.currentUser?.uid ?? '';

  const load = useCallback(async () => {
    setError(null);
    try {
      const [allUsers, me] = await Promise.all([
        getAllUsers(),
        myUid ? getFirestoreUser(myUid) : Promise.resolve(null),
      ]);
      const followingIds = new Set(me?.followingIds ?? []);
      const users = allUsers.filter(u => followingIds.has(u.uid));
      users.sort((a, b) => Number(a.hasWokenToday) - Number(b.hasWokenToday));
      setFollowingUsers(users);
    } catch (e: any) {
      setError(e?.message ?? '読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [myUid]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#2A2A2A" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ color: '#E05C5C', textAlign: 'center', fontSize: 13 }}>{error}</Text>
        <TouchableOpacity onPress={load} style={{ marginTop: 16 }}>
          <Text style={{ color: '#2A2A2A', fontSize: 13 }}>再読み込み</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const awake = followingUsers.filter(u => !u.hasWokenToday);
  const slept = followingUsers.filter(u => u.hasWokenToday);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>夢広場</Text>
        <Text style={styles.subtitle}>まだ眠っているバクたち</Text>
      </View>

      {followingUsers.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>まだ誰もいません</Text>
          <Text style={styles.emptyHint}>検索タブからユーザーをフォローしよう</Text>
        </View>
      ) : (
        <FlatList
          data={followingUsers}
          keyExtractor={u => u.uid}
          numColumns={2}
          contentContainerStyle={styles.grid}
          ListHeaderComponent={
            slept.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>
                  広場にいる: {awake.length}　今日起きた: {slept.length}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => <BakuCard user={item} />}
        />
      )}
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
  subtitle: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#A0A0A0',
    fontWeight: '300',
  },
  emptyHint: {
    fontSize: 12,
    color: '#C0BDB8',
    marginTop: 8,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#A0A0A0',
  },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: '#FDFCF9',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E8E5E0',
  },
  cardWoken: {
    opacity: 0.4,
    backgroundColor: '#F0EEE9',
  },
  bakuThumb: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 13,
    color: '#2A2A2A',
    marginTop: 6,
    fontWeight: '400',
  },
  cardNameWoken: {
    color: '#888',
  },
  cardEma: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 2,
  },
  wokeLabel: {
    fontSize: 10,
    color: '#6B9E78',
    marginTop: 4,
    letterSpacing: 1,
  },
});
