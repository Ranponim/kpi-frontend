/**
 * 빈 상태 컴포넌트
 */

import { cn } from '../../lib/utils';

export default function EmptyState({ icon = 'inbox', title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <span className="material-symbols-outlined text-6xl text-[#2b8cee] mb-4">{icon}</span>
      {title && <h3 className="text-white text-xl font-semibold mb-2">{title}</h3>}
      {description && <p className="text-slate-400 text-base max-w-md">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}





