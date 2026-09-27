import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Currency-aware number formatting using Intl.NumberFormat
 */
export function formatCurrency(amount, currency = 'USD') {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date as "Sep 17, 2026"
 */
export function formatDate(date) {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
}

/**
 * Format date as "Sep 17, 2026, 7:34 PM"
 */
export function formatDateTime(date) {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy, h:mm a');
}

/**
 * Format as relative time "2 hours ago"
 */
export function formatRelativeTime(date) {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Status → badge color classes
 */
export function getStatusColor(status) {
  const map = {
    ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    FAILED: 'bg-red-500/15 text-red-400 border-red-500/30',
    CANCELLED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    EXPIRED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    INACTIVE: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    SUSPENDED: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return map[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
}

/**
 * Transaction type → sign (+/-) for display
 */
export function getAmountSign(type) {
  const creditTypes = ['DEPOSIT', 'REFUND', 'REVERSAL'];
  return creditTypes.includes(type) ? '+' : '-';
}

/**
 * Transaction type → color class
 */
export function getAmountColor(type) {
  const creditTypes = ['DEPOSIT', 'REFUND', 'REVERSAL'];
  return creditTypes.includes(type) ? 'text-emerald-400' : 'text-red-400';
}

/**
 * Generate a unique idempotency key
 */
export function generateIdempotencyKey() {
  return crypto.randomUUID();
}

/**
 * Extract error message from API response or Error object
 * Priority: validation errors → backend message → network error → fallback
 */
export function getApiErrorMessage(error) {
  if (error?.response?.status === 429) {
    return 'Too many requests. Please wait a minute and try again.';
  }
  const errors = error?.response?.data?.errors;
  if (errors?.length) {
    return errors.map((item) => item.msg).join(', ');
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'Something went wrong';
}
