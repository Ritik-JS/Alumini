import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

export const LoadingButton = forwardRef(
  ({ children, loading, disabled, loadingText, ...props }, ref) => {
    return (
      <Button ref={ref} disabled={loading || disabled} {...props}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading && loadingText ? loadingText : children}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
