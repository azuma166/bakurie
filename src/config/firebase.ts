import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCpoyaaaSl5Bcxik-Mb3iuL05gyC1HcaTY",
  authDomain: "bakurie-6f8cd.firebaseapp.com",
  projectId: "bakurie-6f8cd",
  storageBucket: "bakurie-6f8cd.firebasestorage.app",
  messagingSenderId: "995145649386",
  appId: "1:995145649386:web:202f058afbc314acd5db93",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
