/**
 * Fetch with timeout utility
 * Prevents requests from hanging indefinitely
 */

const DEFAULT_TIMEOUT = 10000; // 10 seconds

export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> => {
  const startTime = Date.now();
  const controller = new AbortController();
  
  // Log request details
  try {
    const urlObj = new URL(url);
    console.log('🌐 [FETCH] Starting request to:', url);
    console.log('🌐 [FETCH] Host:', urlObj.hostname, 'Port:', urlObj.port || 'default', 'Path:', urlObj.pathname);
    console.log('⏱️ [FETCH] Timeout set to:', timeout, 'ms');
    console.log('⏱️ [FETCH] Request started at:', new Date().toISOString());
  } catch (e) {
    console.warn('⚠️ [FETCH] Could not parse URL:', url);
  }
  
  const timeoutId = setTimeout(() => {
    const elapsed = Date.now() - startTime;
    console.error(`⏱️ [FETCH] Request timeout after ${elapsed}ms (limit: ${timeout}ms)`);
    console.error(`❌ [FETCH] Timing out request to: ${url}`);
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    const duration = Date.now() - startTime;
    clearTimeout(timeoutId);
    console.log(`✅ [FETCH] Request completed in ${duration}ms`);
    console.log(`📊 [FETCH] Response status: ${response.status} ${response.statusText}`);
    console.log(`📊 [FETCH] Response headers:`, Object.fromEntries(response.headers.entries()));
    
    return response;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    clearTimeout(timeoutId);
    
    console.error(`❌ [FETCH] Request failed after ${duration}ms`);
    console.error(`❌ [FETCH] Error type:`, error.name || typeof error);
    console.error(`❌ [FETCH] Error message:`, error.message || String(error));
    
    if (error.name === 'AbortError') {
      const timeoutError = new Error(`Request timeout after ${timeout}ms: ${url}`);
      console.error(`⏱️ [FETCH] Timeout error for: ${url}`);
      throw timeoutError;
    }
    
    // Check for network errors
    if (error.message && (error.message.includes('Network request failed') || error.message.includes('Failed to fetch'))) {
      console.error(`🌐 [FETCH] Network error - check if server is reachable at: ${url}`);
      try {
        const urlObj = new URL(url);
        console.error(`🌐 [FETCH] Verify IP address: ${urlObj.hostname} and port: ${urlObj.port || 'default'}`);
      } catch (e) {
        // Ignore URL parse errors
      }
    }
    
    throw error;
  }
};
