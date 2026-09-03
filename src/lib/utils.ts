import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: any) {
  if (!date) return '';
  // Handle Firestore Timestamp
  const d = date.toDate ? date.toDate() : new Date(date);
  return format(d, 'MMM d, yyyy');
}

export function formatTimeAgo(date: any) {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return formatDistanceToNow(d, { addSuffix: true });
}
