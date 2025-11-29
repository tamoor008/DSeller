// For web, we'll use environment variable or default URL
// You can set VITE_BASE_URL in your .env file
const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://fallback-url.com'

export const getBaseUrl = () => BASE_URL

