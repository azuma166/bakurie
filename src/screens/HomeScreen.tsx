import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import BakuCanvas from '../components/BakuCanvas';
import { useWakeData } from '../hooks/useWakeData';
import { minutesToTime } from '../utils/ema';
import { generateFragments } from '../utils/fragments';

// 吸い込みパーティクル：6方向から体内へ収束
const ABSORB_COUNT = 6;

export default function HomeScreen() {
  const { profile, records, loading, todayRecorded, recordWake, resetAverage } = useWakeData();
  const [absorbing, setAbsorbing] = useState(false);
  const absorbAnim = useRef(new Animated.Value(0)).current;

  // 食べさせるたびに変わる新しいかけらの色（hue 0〜360）
  const [colorSeed, setColorSeed] = useState(() => Math.floor(Math.random() * 360));
  // 吸い込みパーティクルの色もこのhueに連動
  const [feedHue, setFeedHue] = useState(200);

  const fragments = useMemo(
    () => generateFragments(Math.min(records.length, 20), colorSeed),
    [records.length, colorSeed]
  );

  const handleFeed = useCallback(async () => {
    if (absorbing || !profile) return;

    const newSeed = Math.floor(Math.random() * 360);
    setColorSeed(newSeed);
    setFeedHue(newSeed);
    setAbsorbing(true);

    absorbAnim.setValue(0);
    Animated.timing(absorbAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(async () => {
      await recordWake();
      setAbsorbing(false);
    });
  }, [absorbing, profile, recordWake, absorbAnim]);

  const handleReset = useCallback(() => {
    if (Platform.OS === 'web') {
      if (window.confirm('平均リセット\n\n記録がすべて消え、新しいバクがやってきます。')) {
        resetAverage();
      }
    } else {
      Alert.alert(
        '平均リセット',
        '記録がすべて消え、新しいバクがやってきます。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'リセット', style: 'destructive', onPress: resetAverage },
        ]
      );
    }
  }, [resetAverage]);

  if (loading || !profile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#2A2A2A" />
      </View>
    );
  }

  const emaTime = minutesToTime(profile.emaMinutes);
  const todayRecord = records.find(r => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return r.date === `${yyyy}-${mm}-${dd}`;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Bakurie</Text>
      </View>

      {/* Time info */}
      <View style={styles.timeRow}>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>平均起床</Text>
          <Text style={styles.timeValue}>{emaTime}</Text>
        </View>
        {todayRecord && (
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>今日</Text>
            <Text style={[styles.timeValue, { color: '#6B9E78' }]}>{todayRecord.time}</Text>
          </View>
        )}
      </View>

      {/* Baku */}
      <View style={styles.bakuWrapper}>
        {/* 吸い込みパーティクル：6方向から体内に収束 */}
        {absorbing && (
          <View style={styles.absorbContainer} pointerEvents="none">
            {Array.from({ length: ABSORB_COUNT }, (_, i) => {
              const angle = (i / ABSORB_COUNT) * Math.PI * 2;
              const r = 110;
              const startX = Math.cos(angle) * r;
              const startY = Math.sin(angle) * r;
              const hue = (feedHue + i * 30) % 360;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.absorbParticle,
                    {
                      backgroundColor: `hsl(${hue}, 70%, 65%)`,
                      opacity: absorbAnim.interpolate({
                        inputRange: [0, 0.15, 0.8, 1],
                        outputRange: [0, 1, 0.8, 0],
                      }),
                      transform: [
                        {
                          translateX: absorbAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [startX, 0],
                          }),
                        },
                        {
                          translateY: absorbAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [startY, 0],
                          }),
                        },
                        {
                          scale: absorbAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1.0, 0.1],
                          }),
                        },
                        { rotate: '45deg' },
                      ],
                    },
                  ]}
                />
              );
            })}
          </View>
        )}
        <BakuCanvas
          bakuType={profile.bakuType}
          size={260}
          fragments={fragments}
        />
      </View>

      {/* Feed button */}
      <TouchableOpacity
        style={[styles.feedButton, (absorbing || todayRecorded) && styles.feedButtonDone]}
        onPress={handleFeed}
        disabled={absorbing || todayRecorded}
        activeOpacity={0.75}
      >
        <Text style={styles.feedButtonText}>
          {todayRecorded ? '今日は記録済み ✓' : absorbing ? '夢を食べている…' : '夢を食べさせる'}
        </Text>
      </TouchableOpacity>

      {todayRecorded && todayRecord && (
        <Text style={styles.matchText}>
          一致度：{Math.round(todayRecord.matchScore * 100)}%
        </Text>
      )}

      {/* Reset button */}
      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetText}>平均リセット</Text>
      </TouchableOpacity>

      {/* Record count */}
      <Text style={styles.countText}>累計 {records.length} 日</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EF',
    alignItems: 'center',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: '300',
    color: '#2A2A2A',
    letterSpacing: 4,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 8,
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '300',
    color: '#2A2A2A',
  },
  bakuWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  absorbContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absorbParticle: {
    position: 'absolute',
    width: 12,
    height: 12,
    marginTop: -6,
    marginLeft: -6,
  },
  feedButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 12,
  },
  feedButtonDone: {
    backgroundColor: '#A0A0A0',
  },
  feedButtonText: {
    color: '#F7F4EF',
    fontSize: 15,
    letterSpacing: 1,
  },
  matchText: {
    fontSize: 12,
    color: '#6B9E78',
    marginBottom: 12,
  },
  resetButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C0BDB8',
    marginBottom: 8,
  },
  resetText: {
    fontSize: 12,
    color: '#888',
  },
  countText: {
    fontSize: 11,
    color: '#BCBAB7',
    marginBottom: 16,
  },
});
