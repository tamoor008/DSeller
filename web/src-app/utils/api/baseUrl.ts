import { getRemoteConfig, getValue } from 'firebase/remote-config'
import app from '../../config/firebase'

// Local backend URL (backend runs on port 3001)
const LOCAL_BACKEND_URL = 'http://localhost:3001'

// Check if we're in development mode (localhost or 127.0.0.1)
const isDevelopment = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

// For production, can be overridden by Firebase Remote Config or environment variable
let BASE_URL = process.env.NEXT_PUBLIC_API_URL || LOCAL_BACKEND_URL

// Initialize and fetch base URL from Firebase Remote Config (optional, for production)
export const initializeBaseUrl = async () => {
  // In development (localhost or 127.0.0.1), always use local backend
  if (isDevelopment) {
    BASE_URL = LOCAL_BACKEND_URL
    console.log('✅ [BASE_URL] Using local backend for development:', BASE_URL)
    return
  }

  // For production, try to fetch from Firebase Remote Config
  try {
    const remoteConfig = getRemoteConfig(app)
    
    // Set default values
    remoteConfig.defaultConfig = {
      base_url: BASE_URL,
    }

    // Set settings to avoid caching during development
    remoteConfig.settings = {
      minimumFetchIntervalMillis: 0, // always fetch fresh config
    }

    await remoteConfig.fetchAndActivate()

    const fetchedUrl = getValue(remoteConfig, 'Base_URL').asString()
    console.log('🔍 [BASE_URL] Fetched from Firebase:', fetchedUrl)

    // Only use Firebase URL if it's valid and not the fallback
    if (fetchedUrl && fetchedUrl !== 'https://fallback-url.com' && fetchedUrl.startsWith('http')) {
      BASE_URL = fetchedUrl
      console.log('✅ [BASE_URL] Using Firebase Remote Config URL:', BASE_URL)
    } else {
      console.log('✅ [BASE_URL] Using default URL:', BASE_URL)
    }
  } catch (error) {
    console.log('❌ [BASE_URL] Failed to fetch from Firebase, using default:', BASE_URL)
  }
}

export const getBaseUrl = () => {
  // Always use local backend when in development (localhost or 127.0.0.1)
  if (isDevelopment) {
    return LOCAL_BACKEND_URL
  }
  // For production, return the configured URL
  return BASE_URL
}




