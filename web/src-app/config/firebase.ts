import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

// Firebase configuration
// Fallback to actual values if env vars are not set
// Note: In Next.js, use process.env for environment variables (not import.meta.env which is Vite-specific)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || 'AIzaSyA7e06KDvBoBKZPSk05SDYtrGBd4K2CF7U',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || 'dseller-c21ee.firebaseapp.com',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL || 'https://dseller-c21ee-default-rtdb.firebaseio.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'dseller-c21ee',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || 'dseller-c21ee.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '56884086045',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || '1:56884086045:ios:fd8aa7385abfb576a68df4',
}

// Initialize Firebase with error handling
let app
let auth
let database

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  database = getDatabase(app)
} catch (error) {
  console.error('Firebase initialization error:', error)
  // Re-throw to prevent silent failures
  throw error
}

export { auth, database }
export default app

