import React from 'react';
import { cn, getStatusColor } from '../../lib/utils';

const defaultGetStatusColor = (status) => {
  const s = String(status).toLowerCase();
  if (['completed', 'success', 'active', 'paid', 'credit'].includes(s)) {
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  }
  if (['pending', 'processing', 'warning'].includes(s)) {
    return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  }
  if (['failed', 'cancelled', 'error', 'debit'].includes(s)) {
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  }
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
};

const StatusBadge = ({ status, className }) => {
  let colorClasses = getStatusColor(status);
  if (!colorClasses || colorClasses.includes('bg-slate-500/15')) { // fallback check if not matched
    colorClasses = defaultGetStatusColor(status);
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
      colorClasses,
      className
    )}>
      {status}
    </span>
  );
};

export { StatusBadge };
export default StatusBadge;
