import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 p-4"
        >
          <Alert variant="destructive" className="max-w-md mx-auto">
            <WifiOff className="h-4 w-4" />
            <AlertDescription data-testid="offline-indicator">
              You're currently offline. Some features may not be available.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
