import { useEffect, useRef } from 'react';

/**
 * Custom hook for polling data at regular intervals
 * 
 * @param {Function} callback - Function to call on each poll
 * @param {number} interval - Polling interval in milliseconds (default: 30000ms = 30s)
 * @param {boolean} enabled - Whether polling is enabled (default: true)
 * 
 * @example
 * usePolling(fetchNotifications, 30000); // Poll every 30 seconds
 * usePolling(fetchData, 60000, isActive); // Poll every 60 seconds when isActive is true
 */
const usePolling = (callback, interval = 30000, enabled = true) => {
  const savedCallback = useRef();
  const intervalRef = useRef();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (!enabled) {
      // Clear interval if polling is disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    // Start polling
    intervalRef.current = setInterval(tick, interval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, enabled]);

  // Provide a way to manually trigger the callback
  const trigger = () => {
    if (savedCallback.current) {
      savedCallback.current();
    }
  };

  return { trigger };
};

export default usePolling;
