import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCEfLvy8ws12rfdMpzcUlcAXJGpDjeLtPw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'arenova-test.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'arenova-test',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'arenova-test.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '144453754365',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:144453754365:web:970dc7d74ac1db01f84d94',
};

// Check if variables are missing
const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let app;
let auth;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } catch (error) {
    // Firebase initialization fallback
  }
}

export {
  auth,
  isFirebaseConfigured,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
};

