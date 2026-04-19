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
  } catch (e) {
  }

  const timeoutId = setTimeout(() => {
    const elapsed = Date.now() - startTime;
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const duration = Date.now() - startTime;
    clearTimeout(timeoutId);

    return response;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    clearTimeout(timeoutId);


    if (error.name === 'AbortError') {
      const timeoutError = new Error(`Request timeout after ${timeout}ms: ${url}`);
      throw timeoutError;
    }

    // Check for network errors
    if (error.message && (error.message.includes('Network request failed') || error.message.includes('Failed to fetch'))) {
      try {
        const urlObj = new URL(url);
      } catch (e) {
        // Ignore URL parse errors
      }
    }

    throw error;
  }
};
