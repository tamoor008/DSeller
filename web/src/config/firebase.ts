import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

// Firebase configuration
// Fallback to actual values if env vars are not set
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA7e06KDvBoBKZPSk05SDYtrGBd4K2CF7U',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'dseller-c21ee.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://dseller-c21ee-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'dseller-c21ee',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'dseller-c21ee.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '56884086045',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:56884086045:ios:fd8aa7385abfb576a68df4',
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

