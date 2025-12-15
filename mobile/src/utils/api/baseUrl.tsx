import Constants from 'expo-constants';

// Single source of truth for API base URL.
// Use EXPO_PUBLIC_BASE_URL from .env; fallback to app.json extra; final fallback is hard-coded.
const ENV_BASE_URL =
  process.env.EXPO_PUBLIC_BASE_URL ||
  Constants.expoConfig?.extra?.baseUrl ||
  Constants.manifest2?.extra?.baseUrl;

let BASE_URL = ENV_BASE_URL || 'https://fallback-url.com';

// No-op for compatibility; kept so existing calls don’t break.
export const initializeBaseUrl = async () => {
  console.log('🔧 Base URL set from env/config:', BASE_URL);
};

export const getBaseUrl = () => BASE_URL;
