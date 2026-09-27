import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const LoadingSpinner = ({ text = 'Loading...', fullScreen = false, className, iconClassName }) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 space-y-4 text-slate-400',
      fullScreen ? 'fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm' : '',
      className
    )}>
      <Loader2 className={cn('w-8 h-8 animate-spin text-emerald-500', iconClassName)} />
      {text && <p className="text-sm font-medium">{text}</p>}
    </div>
  );
};

export { LoadingSpinner };
export default LoadingSpinner;
