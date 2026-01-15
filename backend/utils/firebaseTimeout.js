/**
 * Utility to add timeout to Firebase operations
 * Prevents Firebase operations from hanging indefinitely
 */

/**
 * Wraps a promise with a timeout
 * @param {Promise} promise - The promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds (default: 15000ms)
 * @param {string} operationName - Name of the operation for error messages
 * @returns {Promise} - Promise that rejects if timeout is exceeded
 */
function withTimeout(promise, timeoutMs = 15000, operationName = 'Firebase operation') {
  let timeoutId;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms. This may indicate Firebase credential issues or network problems. Please check your Firebase service account configuration.`));
    }, timeoutMs);
  });

  // Race the promises and clean up timeout on completion
  return Promise.race([
    promise.then(
      (result) => {
        if (timeoutId) clearTimeout(timeoutId);
        return result;
      },
      (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }
    ),
    timeoutPromise
  ]);
}

module.exports = {
  withTimeout,
};
