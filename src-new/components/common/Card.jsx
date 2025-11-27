/**
 * 카드 컴포넌트
 */

import { cn } from '../../lib/utils';

export default function Card({ children, title, subtitle, actions, className, noPadding, ...props }) {
  return (
    <div
      className={cn('rounded-xl border border-slate-200/10 bg-[#111a22]', !noPadding && 'p-6', className)}
      {...props}
    >
      {(title || actions) && (
        <div className={cn('flex items-center justify-between gap-4', noPadding ? 'p-6 pb-0' : 'mb-4')}>
          <div>
            {title && <h3 className="text-white text-lg font-semibold">{title}</h3>}
            {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}






