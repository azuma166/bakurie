import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserInFirestore } from '../services/firestoreUser';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password) return;

    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await createUserInFirestore(cred.user.uid, {});
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e: any) {
      setError(errorMessage(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>Bakurie</Text>
        <Text style={styles.tagline}>夢を食べるバクと、起きる習慣を。</Text>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'signin' && styles.modeBtnActive]}
            onPress={() => { setMode('signin'); setError(''); }}
          >
            <Text style={[styles.modeBtnText, mode === 'signin' && styles.modeBtnTextActive]}>
              ログイン
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
            onPress={() => { setMode('signup'); setError(''); }}
          >
            <Text style={[styles.modeBtnText, mode === 'signup' && styles.modeBtnTextActive]}>
              新規登録
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="メールアドレス"
          placeholderTextColor="#BCBAB7"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="パスワード（6文字以上）"
          placeholderTextColor="#BCBAB7"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#F7F4EF" />
            : <Text style={styles.submitBtnText}>
                {mode === 'signin' ? 'ログイン' : '登録してはじめる'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function errorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':           return 'メールアドレスの形式が正しくありません';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':      return 'メールアドレスまたはパスワードが違います';
    case 'auth/email-already-in-use':    return 'このメールアドレスはすでに使われています';
    case 'auth/weak-password':           return 'パスワードは6文字以上にしてください';
    case 'auth/too-many-requests':       return 'しばらく時間をおいてからお試しください';
    default:                             return '通信エラーが発生しました。再度お試しください';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EF',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: '300',
    color: '#2A2A2A',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 12,
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#EDEAE5',
    borderRadius: 12,
    padding: 3,
    marginBottom: 24,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: '#F7F4EF',
  },
  modeBtnText: {
    fontSize: 13,
    color: '#888',
  },
  modeBtnTextActive: {
    color: '#2A2A2A',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FDFCF9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#E8E5E0',
    marginBottom: 12,
  },
  error: {
    fontSize: 12,
    color: '#C0706A',
    textAlign: 'center',
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#A0A0A0',
  },
  submitBtnText: {
    color: '#F7F4EF',
    fontSize: 15,
    letterSpacing: 1,
  },
});
