import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';

const firebaseConfig = {
  projectId: "deep-dispatcher-6pt51",
  appId: "1:618138612144:web:dd0acb3407fb496a79e675",
  apiKey: "AIzaSyA5CpJ8Z5_4Rl2R54s46GCkF6GWCo37Nus",
  authDomain: "deep-dispatcher-6pt51.firebaseapp.com",
  storageBucket: "deep-dispatcher-6pt51.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const storageRef = ref(storage, 'test.txt');

uploadString(storageRef, 'hello world')
  .then(() => console.log('Upload successful'))
  .catch((err) => console.error('Upload failed', err.message));
