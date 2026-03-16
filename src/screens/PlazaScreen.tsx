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
import { getFollowRelation, getMockUserById, MOCK_USERS } from '../store/storage';
import { MockUser } from '../types';
import { minutesToTime } from '../utils/ema';
import { generateFragments } from '../utils/fragments';

function BakuCard({ user, onPress }: { user: MockUser; onPress: () => void }) {
  const fragments = React.useMemo(
    () => generateFragments(Math.min(user.recordCount, 20)),
    [user.recordCount]
  );
  return (
    <TouchableOpacity
      style={[styles.card, user.hasWokenToday && styles.cardWoken]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.bakuThumb, user.hasWokenToday && styles.bakuThumbWoken]}>
        <BakuCanvas bakuType={user.bakuType} size={64} fragments={fragments} />
      </View>
      <Text style={[styles.cardName, user.hasWokenToday && styles.cardNameWoken]}>
        {user.name}
      </Text>
      <Text style={styles.cardEma}>{minutesToTime(user.emaMinutes)}</Text>
      {user.hasWokenToday && (
        <Text style={styles.wokeLabel}>起きた</Text>
      )}
    </TouchableOpacity>
  );
}

export default function PlazaScreen() {
  const [followingUsers, setFollowingUsers] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const rel = await getFollowRelation();
    const ids = new Set(rel.followingIds);
    const users = Array.from(ids)
      .map(id => getMockUserById(id))
      .filter((u): u is MockUser => !!u);
    // Sort: not woken first (still "in plaza"), then woken
    users.sort((a, b) => Number(a.hasWokenToday) - Number(b.hasWokenToday));
    setFollowingUsers(users);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#2A2A2A" />
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
          keyExtractor={u => u.id}
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
          renderItem={({ item }) => (
            <BakuCard
              user={item}
              onPress={() => {}}
            />
          )}
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
  bakuThumbWoken: {
    // grayscale effect via opacity on parent
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
