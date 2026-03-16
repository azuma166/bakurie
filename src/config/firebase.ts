import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCpoyaaaSl5Bcxik-Mb3iuL05gyC1HcaTY",
  authDomain: "bakurie-6f8cd.firebaseapp.com",
  projectId: "bakurie-6f8cd",
  storageBucket: "bakurie-6f8cd.firebasestorage.app",
  messagingSenderId: "995145649386",
  appId: "1:995145649386:web:202f058afbc314acd5db93",
};

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
