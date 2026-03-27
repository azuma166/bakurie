import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './src/config/firebase';
import TabNavigator from './src/navigation/TabNavigator';
import AuthScreen from './src/screens/AuthScreen';
import { clearAllData } from './src/store/storage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let prevUid: string | undefined;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      // ユーザーが切り替わった（別ユーザーへの切替 or ログアウト）場合にローカルデータをクリア
      if (prevUid !== undefined && prevUid !== u?.uid) {
        await clearAllData();
      }
      prevUid = u?.uid;
      setUser(u);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F4EF' }}>
        <ActivityIndicator color="#2A2A2A" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {user ? <TabNavigator /> : <AuthScreen />}
    </SafeAreaProvider>
  );
}
