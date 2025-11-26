/**
 * 버튼 컴포넌트
 */

import { cn } from '../../lib/utils';

const variants = {
  primary: 'bg-[#2b8cee] text-white hover:bg-[#1a7ad9]',
  secondary: 'bg-slate-800/50 text-white hover:bg-slate-800 border border-slate-200/10',
  ghost: 'text-slate-300 hover:text-white hover:bg-white/5',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  className,
  disabled,
  loading,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-lg">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="material-symbols-outlined text-lg">{iconRight}</span>
      )}
    </button>
  );
}



