import React from 'react';
import { FileQuestion } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './Button';

const EmptyState = ({ 
  icon: Icon = FileQuestion, 
  title = 'No data found', 
  description = 'There is currently no data to display here.',
  actionLabel,
  onAction,
  className 
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center rounded-xl border border-slate-800 border-dashed bg-slate-900/50', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export { EmptyState };
export default EmptyState;
