import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './Button';

const ErrorState = ({ 
  message = 'An unexpected error occurred.', 
  onRetry,
  className 
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center rounded-xl border border-red-900/50 bg-red-950/20', className)}>
      <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-slate-100 mb-2">Error</h3>
      <p className="text-sm text-slate-300 max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          Try Again
        </Button>
      )}
    </div>
  );
};

export { ErrorState };
export default ErrorState;
