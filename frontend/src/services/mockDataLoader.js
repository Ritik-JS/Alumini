/**
 * Mock Data Loader
 * 
 * This utility handles loading mockdata.json in both development and production environments.
 * - In development: Imports directly from src folder
 * - In production: Fetches from public folder if import fails
 */

let mockDataCache = null;
let mockDataPromise = null;

/**
 * Load mock data with fallback mechanism
 * @returns {Promise<Object>} The mock data object
 */
export const loadMockData = async () => {
  // Return cached data if available
  if (mockDataCache) {
    return mockDataCache;
  }

  // Return existing promise if loading is in progress
  if (mockDataPromise) {
    return mockDataPromise;
  }

  // Start loading
  mockDataPromise = (async () => {
    try {
      // Try to import from src folder first (works in development)
      const data = await import('../mockdata.json');
      mockDataCache = data.default || data;
      return mockDataCache;
    } catch (error) {
      console.warn('Failed to import mockdata.json from src, fetching from public folder...', error);
      
      try {
        // Fallback: Fetch from public folder (works in production build)
        const response = await fetch('/mockdata.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        mockDataCache = await response.json();
        return mockDataCache;
      } catch (fetchError) {
        console.error('Failed to load mockdata.json from public folder:', fetchError);
        throw new Error('Failed to load mock data from both src and public folders');
      }
    }
  })();

  return mockDataPromise;
};

/**
 * Clear the mock data cache (useful for testing)
 */
export const clearMockDataCache = () => {
  mockDataCache = null;
  mockDataPromise = null;
};

/**
 * Get cached mock data synchronously (returns null if not loaded)
 * @returns {Object|null} The cached mock data or null
 */
export const getMockDataSync = () => {
  return mockDataCache;
};
