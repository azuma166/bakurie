import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import PlazaScreen from '../screens/PlazaScreen';
import RecordsScreen from '../screens/RecordsScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';

type TabName = 'home' | 'plaza' | 'records' | 'search' | 'profile';

const TABS: { name: TabName; label: string; icon: string }[] = [
  { name: 'home',    label: 'ホーム',      icon: '🌙' },
  { name: 'plaza',   label: '夢広場',      icon: '🌿' },
  { name: 'records', label: '記録',        icon: '📋' },
  { name: 'search',  label: '検索',        icon: '🔍' },
  { name: 'profile', label: 'プロフィール', icon: '👤' },
];

export default function TabNavigator() {
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const insets = useSafeAreaInsets();

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':    return <HomeScreen />;
      case 'plaza':   return <PlazaScreen />;
      case 'records': return <RecordsScreen />;
      case 'search':  return <SearchScreen />;
      case 'profile': return <ProfileScreen />;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {renderScreen()}
      </View>
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {TABS.map(tab => {
          const active = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.name)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, !active && styles.tabIconInactive]}>
                {tab.icon}
              </Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EF',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F7F4EF',
    borderTopWidth: 1,
    borderTopColor: '#E0DDD8',
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabIconInactive: {
    opacity: 0.35,
  },
  tabLabel: {
    fontSize: 9,
    color: '#A0A0A0',
    marginTop: 1,
  },
  tabLabelActive: {
    color: '#2A2A2A',
    fontWeight: '500',
  },
});
