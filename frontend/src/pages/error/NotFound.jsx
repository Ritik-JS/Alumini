import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <motion.div
              className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-6"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              <FileQuestion className="h-12 w-12 text-blue-600" />
            </motion.div>
            <h1 className="text-6xl font-bold text-gray-900 mb-2" data-testid="not-found-title">
              404
            </h1>
            <h2 className="text-2xl font-semibold mb-3">Page Not Found</h2>
            <p className="text-gray-500 mb-8 max-w-sm">
              Sorry, we couldn't find the page you're looking for. The page might have been removed,
              renamed, or doesn't exist.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate(-1)} variant="outline" data-testid="go-back-btn">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
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

export default NotFound;
