import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import BakuCanvas from '../components/BakuCanvas';
import { useWakeData } from '../hooks/useWakeData';
import { getFollowRelation, clearAllData } from '../store/storage';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { FollowRelation } from '../types';
import { minutesToTime } from '../utils/ema';

export default function ProfileScreen() {
  const { profile, records, loading, resetAverage, updateProfile } = useWakeData();
  const [relation, setRelation] = useState<FollowRelation>({ followingIds: [] });
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  const loadRelation = useCallback(async () => {
    const rel = await getFollowRelation();
    setRelation(rel);
  }, []);

  useEffect(() => { loadRelation(); }, [loadRelation]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditBio(profile.bio);
    }
  }, [profile]);

  const handlePickAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      await updateProfile({ avatarUri: result.assets[0].uri });
    }
  }, [updateProfile]);

  const handleSave = useCallback(async () => {
    await updateProfile({ name: editName.trim() || 'ユーザー', bio: editBio.trim() });
    setEditing(false);
  }, [editName, editBio, updateProfile]);

  const handleReset = useCallback(() => {
    Alert.alert(
      '平均リセット',
      '記録がすべて消え、新しいバクがやってきます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'リセット', style: 'destructive', onPress: resetAverage },
      ]
    );
  }, [resetAverage]);


  const handleClearAll = useCallback(() => {
    Alert.alert(
      'データをすべて削除',
      '記録・プロフィール・フォローがすべて消えます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('削除完了', 'データをすべて削除しました。アプリを再起動してください。');
          },
        },
      ]
    );
  }, []);

  if (loading || !profile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#2A2A2A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>プロフィール</Text>
          <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)}>
            <Text style={styles.editBtn}>{editing ? '保存' : '編集'}</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar + Baku */}
        <View style={styles.avatarRow}>
          <TouchableOpacity onPress={editing ? handlePickAvatar : undefined}>
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {editing ? '📷' : profile.name.charAt(0)}
                </Text>
              </View>
            )}
            {editing && <Text style={styles.avatarHint}>変更</Text>}
          </TouchableOpacity>

          <BakuCanvas bakuType={profile.bakuType} size={120} />
        </View>

        {/* Name / Bio */}
        {editing ? (
          <View style={styles.editSection}>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="ユーザー名"
              placeholderTextColor="#BCBAB7"
              maxLength={20}
            />
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="自己紹介"
              placeholderTextColor="#BCBAB7"
              multiline
              maxLength={100}
            />
          </View>
        ) : (
          <View style={styles.nameSection}>
            <Text style={styles.name}>{profile.name}</Text>
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          </View>
        )}

        {/* Follow stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{relation.followingIds.length}</Text>
            <Text style={styles.statLabel}>フォロー中</Text>
          </View>
        </View>

        {/* Wake stats */}
        <View style={styles.wakeStats}>
          <View style={styles.wakeStatItem}>
            <Text style={styles.wakeStatNum}>{records.length}</Text>
            <Text style={styles.wakeStatLabel}>累計記録日数</Text>
          </View>
          <View style={styles.wakeStatItem}>
            <Text style={styles.wakeStatNum}>{minutesToTime(profile.emaMinutes)}</Text>
            <Text style={styles.wakeStatLabel}>平均起床時刻</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Usage guide */}
        <Text style={styles.sectionTitle}>使い方</Text>
        <View style={styles.guideBox}>
          {[
            { step: '1', text: '朝目覚めたら「夢を食べさせる」ボタンを押す' },
            { step: '2', text: 'バクが起床時刻を記録し、夢のかけらを吸収する' },
            { step: '3', text: '毎日続けると平均起床時刻（EMA）が更新される' },
            { step: '4', text: '夢広場でフォロー中のバクたちの状況を確認する' },
            { step: '5', text: '平均をリセットすると新しいバクが現れる' },
          ].map(({ step, text }) => (
            <View key={step} style={styles.guideRow}>
              <View style={styles.guideStepBadge}>
                <Text style={styles.guideStepText}>{step}</Text>
              </View>
              <Text style={styles.guideText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Settings */}
        <Text style={styles.sectionTitle}>設定</Text>
        <TouchableOpacity style={styles.settingRow} onPress={handleReset}>
          <Text style={styles.settingText}>平均リセット（新しいバクを迎える）</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow} onPress={handleClearAll}>
          <Text style={[styles.settingText, { color: '#A08080' }]}>データの初期化</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow} onPress={() => signOut(auth)}>
          <Text style={[styles.settingText, { color: '#A08080' }]}>ログアウト</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EF',
  },
  scroll: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '300',
    color: '#2A2A2A',
    letterSpacing: 2,
  },
  editBtn: {
    fontSize: 14,
    color: '#6B9E78',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8E5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 28,
    color: '#888',
  },
  avatarHint: {
    textAlign: 'center',
    fontSize: 10,
    color: '#6B9E78',
    marginTop: 4,
  },
  editSection: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FDFCF9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#E8E5E0',
  },
  bioInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  nameSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '400',
    color: '#2A2A2A',
  },
  bio: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 0,
    marginBottom: 16,
    marginHorizontal: 20,
    backgroundColor: '#FDFCF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5E0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E8E5E0',
    marginVertical: 10,
  },
  statNum: {
    fontSize: 20,
    fontWeight: '300',
    color: '#2A2A2A',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  wakeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  wakeStatItem: {
    alignItems: 'center',
  },
  wakeStatNum: {
    fontSize: 22,
    fontWeight: '300',
    color: '#2A2A2A',
  },
  wakeStatLabel: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E5E0',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#A0A0A0',
    paddingHorizontal: 20,
    marginBottom: 8,
    letterSpacing: 1,
  },
  guideBox: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FDFCF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 10,
  },
  guideStepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E8E5E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  guideStepText: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
  },
  guideText: {
    flex: 1,
    fontSize: 13,
    color: '#4A4A4A',
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  settingText: {
    fontSize: 14,
    color: '#2A2A2A',
  },
  settingArrow: {
    fontSize: 18,
    color: '#C0BDB8',
  },
});
