import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getWakeRecords, getUserProfile } from '../store/storage';
import { WakeRecord, UserProfile } from '../types';
import { timeToMinutes, minutesToTime } from '../utils/ema';

const SCREEN_W = Dimensions.get('window').width;

function formatDisplayDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${m}/${d}`;
}

function RecordItem({ record }: { record: WakeRecord }) {
  const score = Math.round(record.matchScore * 100);
  const scoreColor = score >= 80 ? '#6B9E78' : score >= 50 ? '#C4A55A' : '#A08080';
  return (
    <View style={styles.recordRow}>
      <Text style={styles.recordDate}>{formatDisplayDate(record.date)}</Text>
      <Text style={styles.recordTime}>{record.time}</Text>
      <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '22' }]}>
        <Text style={[styles.scoreText, { color: scoreColor }]}>{score}%</Text>
      </View>
    </View>
  );
}

export default function RecordsScreen() {
  const [records, setRecords] = useState<WakeRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [r, p] = await Promise.all([getWakeRecords(), getUserProfile()]);
    setRecords(r);
    setProfile(p);
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

  // Build chart data from records (oldest first for graph)
  const chartRecords = [...records].reverse().slice(-14); // last 14 days
  const hasChart = chartRecords.length >= 2;

  const chartData = chartRecords.map(r => timeToMinutes(r.time) / 60); // hours
  const chartLabels = chartRecords.map(r => formatDisplayDate(r.date));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>記録一覧</Text>
        {profile && (
          <Text style={styles.ema}>平均起床：{minutesToTime(profile.emaMinutes)}</Text>
        )}
      </View>

      {hasChart && (
        <View style={styles.chartWrapper}>
          <Text style={styles.chartTitle}>起床時刻の推移（EMA）</Text>
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [
                {
                  data: chartData,
                  color: () => '#2A2A2A',
                  strokeWidth: 1.5,
                },
              ],
            }}
            width={SCREEN_W - 32}
            height={160}
            yAxisSuffix="h"
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: '#F7F4EF',
              backgroundGradientFrom: '#F7F4EF',
              backgroundGradientTo: '#F7F4EF',
              decimalPlaces: 1,
              color: () => '#2A2A2A',
              labelColor: () => '#888',
              style: { borderRadius: 8 },
              propsForDots: {
                r: '3',
                strokeWidth: '1',
                stroke: '#2A2A2A',
                fill: '#F7F4EF',
              },
              propsForBackgroundLines: {
                stroke: '#E8E5E0',
                strokeDasharray: '',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>まだ記録がありません</Text>
          <Text style={styles.emptyHint}>ホーム画面でバクに夢を食べさせましょう</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={r => r.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderDate}>日付</Text>
              <Text style={styles.listHeaderTime}>時刻</Text>
              <Text style={styles.listHeaderScore}>一致度</Text>
            </View>
          }
          renderItem={({ item }) => <RecordItem record={item} />}
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
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '300',
    color: '#2A2A2A',
    letterSpacing: 2,
  },
  ema: {
    fontSize: 13,
    color: '#888',
  },
  chartWrapper: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 11,
    color: '#A0A0A0',
    marginBottom: 4,
    marginLeft: 4,
  },
  chart: {
    borderRadius: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5E0',
    marginBottom: 4,
  },
  listHeaderDate: {
    flex: 1,
    fontSize: 11,
    color: '#A0A0A0',
  },
  listHeaderTime: {
    width: 60,
    fontSize: 11,
    color: '#A0A0A0',
  },
  listHeaderScore: {
    width: 60,
    fontSize: 11,
    color: '#A0A0A0',
    textAlign: 'right',
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  recordDate: {
    flex: 1,
    fontSize: 14,
    color: '#2A2A2A',
  },
  recordTime: {
    width: 60,
    fontSize: 16,
    fontWeight: '300',
    color: '#2A2A2A',
  },
  scoreBadge: {
    width: 60,
    alignItems: 'flex-end',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '400',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
  },
  emptyHint: {
    fontSize: 12,
    color: '#BCBAB7',
  },
});
