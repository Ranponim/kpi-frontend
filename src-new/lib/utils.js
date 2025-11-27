/**
 * 유틸리티 함수 모듈
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date, format = 'YYYY-MM-DD HH:mm') {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
}

export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined) return '-';
  if (typeof value !== 'number') return String(value);
  return value.toFixed(decimals);
}

export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined) return '-';
  return `${formatNumber(value, decimals)}%`;
}

export function formatChange(value, decimals = 2) {
  if (value === null || value === undefined) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumber(value, decimals)}%`;
}

export function getStatusStyle(status) {
  const styles = {
    normal: { color: 'text-green-400', bg: 'bg-green-500', bgLight: 'bg-green-500/10', label: 'Normal' },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-500', bgLight: 'bg-yellow-500/10', label: 'Warning' },
    critical: { color: 'text-red-400', bg: 'bg-red-500', bgLight: 'bg-red-500/10', label: 'Critical' },
  };
  return styles[status] || styles.normal;
}

export function getTrendStyle(value, inverseColor = false) {
  if (value === 0) return { color: 'text-slate-400', icon: 'remove', label: 'Stable' };
  const isPositive = value > 0;
  const isGood = inverseColor ? !isPositive : isPositive;
  return {
    color: isGood ? 'text-green-400' : 'text-red-400',
    icon: isPositive ? 'arrow_upward' : 'arrow_downward',
    label: isPositive ? 'Up' : 'Down',
  };
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}










