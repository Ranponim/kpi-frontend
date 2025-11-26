/**
 * 배지 컴포넌트
 */

import { cn } from '../../lib/utils';

const variants = {
  normal: 'bg-green-500/10 text-green-400 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  default: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function Badge({ children, variant = 'default', dot, className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            variant === 'normal' && 'bg-green-500',
            variant === 'warning' && 'bg-yellow-500',
            variant === 'critical' && 'bg-red-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'default' && 'bg-slate-500'
          )}
        />
      )}
      {children}
    </span>
  );
}

