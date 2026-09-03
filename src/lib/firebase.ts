import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "deep-dispatcher-6pt51",
  appId: "1:618138612144:web:dd0acb3407fb496a79e675",
  apiKey: "AIzaSyA5CpJ8Z5_4Rl2R54s46GCkF6GWCo37Nus",
  authDomain: "deep-dispatcher-6pt51.firebaseapp.com",
  storageBucket: "deep-dispatcher-6pt51.firebasestorage.app",
  messagingSenderId: "618138612144"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-df0d08c0-c6a7-40da-b4ec-5f4e116d1e91");
