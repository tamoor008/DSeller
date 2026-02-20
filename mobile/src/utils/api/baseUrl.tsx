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
// For iPhone testing on same network, use your Mac's local IP (e.g., http://192.168.30.184:3002)
// For iOS Simulator, use http://localhost:3002
// NOTE: Port changed from 3001 to 3002
const FALLBACK_BASE_URL = ENV_BASE_URL || '';

let BASE_URL = FALLBACK_BASE_URL;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Fetches the Base_URL from Firebase Realtime Database
 * Always uses the value from Firebase, with fallback to env/config if Firebase fails
 */
const fetchBaseUrlFromFirebase = async (): Promise<string> => {
  const startTime = Date.now();
  try {
    console.log('🔍 [BASE URL] Starting Firebase fetch...');
    console.log('🔍 [BASE URL] Fallback URL:', FALLBACK_BASE_URL);

    const database = getDatabase(app);
    const baseUrlRef = ref(database, 'Base_URL');

    console.log('⏱️ [BASE URL] Firebase get() called at:', new Date().toISOString());
    // Try to get the value once
    const snapshot = await get(baseUrlRef);
    const fetchDuration = Date.now() - startTime;
    console.log(`⏱️ [BASE URL] Firebase get() completed in ${fetchDuration}ms`);

    if (snapshot.exists()) {
      const firebaseBaseUrl = snapshot.val();
      console.log('📥 [BASE URL] Raw Firebase value:', firebaseBaseUrl);
      console.log('📥 [BASE URL] Value type:', typeof firebaseBaseUrl);

      if (firebaseBaseUrl && typeof firebaseBaseUrl === 'string') {
        // Extract IP and port for logging
        try {
          const url = new URL(firebaseBaseUrl);
          console.log('✅ [BASE URL] Fetched from Firebase:', firebaseBaseUrl);
          console.log('🌐 [BASE URL] Parsed URL - Host:', url.hostname, 'Port:', url.port, 'Protocol:', url.protocol);
          console.log(`⏱️ [BASE URL] Total fetch time: ${Date.now() - startTime}ms`);
          return firebaseBaseUrl;
        } catch (urlError) {
          console.warn('⚠️ [BASE URL] Invalid URL format from Firebase:', firebaseBaseUrl);
          console.warn('⚠️ [BASE URL] URL parse error:', urlError);
        }
      } else {
        console.warn('⚠️ [BASE URL] Firebase value is not a valid string:', firebaseBaseUrl);
      }
    } else {
      console.warn('⚠️ [BASE URL] Firebase snapshot does not exist');
    }

    console.warn('⚠️ [BASE URL] Firebase Base_URL not found or invalid, using fallback');
    console.log('🔄 [BASE URL] Using fallback URL:', FALLBACK_BASE_URL);
    console.log(`⏱️ [BASE URL] Total time (with fallback): ${Date.now() - startTime}ms`);
    return FALLBACK_BASE_URL;
  } catch (error) {
    const errorDuration = Date.now() - startTime;
    console.error('❌ [BASE URL] Error fetching from Firebase:', error);
    console.error('❌ [BASE URL] Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ [BASE URL] Error duration:', errorDuration, 'ms');
    console.log('🔄 [BASE URL] Using fallback URL:', FALLBACK_BASE_URL);
    console.log(`⏱️ [BASE URL] Total time (with error): ${Date.now() - startTime}ms`);
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
    console.warn('⚠️ [BASE URL] Fallback URL:', FALLBACK_BASE_URL);
    return FALLBACK_BASE_URL;
  }
  console.log('🔗 [BASE URL] getBaseUrl() called, returning:', BASE_URL);
  try {
    const url = new URL(BASE_URL);
    console.log('🌐 [BASE URL] Current URL details - Host:', url.hostname, 'Port:', url.port || 'default', 'Protocol:', url.protocol);
  } catch (e) {
    console.warn('⚠️ [BASE URL] Could not parse current URL:', BASE_URL);
  }
  return BASE_URL;
};
