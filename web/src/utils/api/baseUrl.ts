import { getRemoteConfig, getValue } from 'firebase/remote-config'
import app from '../../config/firebase'

let BASE_URL = 'https://fallback-url.com' // default

// Initialize and fetch base URL from Firebase Remote Config
export const initializeBaseUrl = async () => {
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
    console.log(fetchedUrl, 'fetchedUrl')

    if (fetchedUrl) {
      BASE_URL = fetchedUrl
      console.log('✅ Fetched BASE_URL from Firebase:', BASE_URL)
    }
  } catch (error) {
    console.log('❌ Failed to fetch BASE_URL from Firebase:', error)
  }
}

export const getBaseUrl = () => BASE_URL




