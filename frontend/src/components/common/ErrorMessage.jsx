import React from 'react';
import { Button } from '@/components/ui/button';

export const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12" data-testid="error-message">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Data</h3>
      <p className="text-gray-600 mb-4 text-center max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} data-testid="retry-button">
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorMessage;
