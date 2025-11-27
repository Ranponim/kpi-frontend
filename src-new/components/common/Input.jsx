/**
 * 입력 필드 컴포넌트
 */

import { cn } from '../../lib/utils';

export default function Input({
  label,
  icon,
  error,
  className,
  containerClassName,
  ...props
}) {
  return (
    <div className={cn('flex flex-col', containerClassName)}>
      {label && <label className="text-white text-sm font-medium mb-2">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          className={cn(
            'w-full h-12 rounded-lg bg-[#192633] border border-[#324d67]',
            'text-white placeholder:text-slate-400',
            'focus:outline-none focus:border-[#2b8cee] focus:ring-2 focus:ring-[#2b8cee]/30',
            'transition-colors',
            icon ? 'pl-12 pr-4' : 'px-4',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30',
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-red-400 text-sm mt-1">{error}</span>}
    </div>
  );
}







