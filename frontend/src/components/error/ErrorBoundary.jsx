import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl" data-testid="error-boundary-title">
                    Oops! Something went wrong
                  </CardTitle>
                  <p className="text-gray-500 mt-1">
                    We're sorry for the inconvenience. Please try again.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
                  <pre className="text-xs text-red-700 overflow-auto max-h-40">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-red-700 overflow-auto max-h-40 mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <Button onClick={this.handleReset} data-testid="error-retry-btn">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" asChild data-testid="error-home-btn">
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
