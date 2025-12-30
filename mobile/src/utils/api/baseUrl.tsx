import Constants from 'expo-constants';
import { getDatabase, ref, get, onValue } from 'firebase/database';
import app from '../../../firebase';

// Single source of truth for API base URL.
// Use EXPO_PUBLIC_BASE_URL from .env; fallback to app.json extra; final fallback is hard-coded.
const ENV_BASE_URL =
  process.env.EXPO_PUBLIC_BASE_URL ||
  Constants.expoConfig?.extra?.baseUrl ||
  Constants.manifest2?.extra?.baseUrl;

// Fallback to localhost for development, or local IP for device testing
// For iPhone testing on same network, use your Mac's local IP (e.g., http://192.168.30.184:3001)
// For iOS Simulator, use http://localhost:3001
const FALLBACK_BASE_URL = ENV_BASE_URL || 'http://192.168.30.184:3001';

let BASE_URL = FALLBACK_BASE_URL;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Fetches the Base_URL from Firebase Realtime Database
 * Always uses the value from Firebase, with fallback to env/config if Firebase fails
 */
const fetchBaseUrlFromFirebase = async (): Promise<string> => {
  try {
    const database = getDatabase(app);
    const baseUrlRef = ref(database, 'Base_URL');
    
    // Try to get the value once
    const snapshot = await get(baseUrlRef);
    
    if (snapshot.exists()) {
      const firebaseBaseUrl = snapshot.val();
      if (firebaseBaseUrl && typeof firebaseBaseUrl === 'string') {
        console.log('✅ [BASE URL] Fetched from Firebase:', firebaseBaseUrl);
        return firebaseBaseUrl;
      }
    }
    
    console.warn('⚠️ [BASE URL] Firebase Base_URL not found or invalid, using fallback');
    return FALLBACK_BASE_URL;
  } catch (error) {
    console.error('❌ [BASE URL] Error fetching from Firebase:', error);
    console.log('🔄 [BASE URL] Using fallback URL:', FALLBACK_BASE_URL);
    return FALLBACK_BASE_URL;
  }
};

/**
 * Sets up a listener to Firebase Realtime Database for Base_URL changes
 * This ensures the app always uses the latest Base_URL from Firebase
 */
const setupFirebaseListener = () => {
  try {
    const database = getDatabase(app);
    const baseUrlRef = ref(database, 'Base_URL');
    
    // Listen for changes to Base_URL in real-time
    onValue(baseUrlRef, (snapshot) => {
      if (snapshot.exists()) {
        const newBaseUrl = snapshot.val();
        if (newBaseUrl && typeof newBaseUrl === 'string' && newBaseUrl !== BASE_URL) {
          console.log('🔄 [BASE URL] Updated from Firebase:', newBaseUrl);
          BASE_URL = newBaseUrl;
        }
      }
    }, (error) => {
      console.error('❌ [BASE URL] Firebase listener error:', error);
    });
  } catch (error) {
    console.error('❌ [BASE URL] Error setting up Firebase listener:', error);
  }
};

/**
 * Initializes the base URL by fetching it from Firebase Realtime Database
 * This should be called once when the app starts
 */
export const initializeBaseUrl = async (): Promise<void> => {
  // If already initialized, return the existing promise
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // If already initialized synchronously, just return
  if (isInitialized) {
    return Promise.resolve();
  }
  
  // Create a promise for initialization
  initializationPromise = (async () => {
    try {
      BASE_URL = await fetchBaseUrlFromFirebase();
      setupFirebaseListener(); // Set up real-time listener for future changes
      isInitialized = true;
      console.log('🔧 [BASE URL] Initialized:', BASE_URL);
    } catch (error) {
      console.error('❌ [BASE URL] Initialization error:', error);
      BASE_URL = FALLBACK_BASE_URL;
      isInitialized = true;
    }
  })();
  
  return initializationPromise;
};

/**
 * Gets the current base URL
 * Returns the cached value (which is kept up-to-date via Firebase listener)
 */
export const getBaseUrl = (): string => {
  // If not initialized yet, return fallback (shouldn't happen if initializeBaseUrl is called)
  if (!isInitialized) {
    console.warn('⚠️ [BASE URL] getBaseUrl called before initialization, using fallback');
    return FALLBACK_BASE_URL;
  }
  return BASE_URL;
};
