import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ServerCrash, Home, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ServerError = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <motion.div
              className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ServerCrash className="h-12 w-12 text-red-600" />
            </motion.div>
            <h1 className="text-6xl font-bold text-gray-900 mb-2" data-testid="server-error-title">
              500
            </h1>
            <h2 className="text-2xl font-semibold mb-3">Server Error</h2>
            <p className="text-gray-500 mb-8 max-w-sm">
              Oops! Something went wrong on our end. Our team has been notified and we're working to
              fix the issue. Please try again later.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleRefresh} variant="outline" data-testid="refresh-btn">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>
              <Button asChild data-testid="home-btn">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ServerError;
