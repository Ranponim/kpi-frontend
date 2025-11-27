/**
 * 로딩 스피너 컴포넌트
 */

import { cn } from '../../lib/utils';

export default function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' };
  return (
    <span className={cn('material-symbols-outlined animate-spin text-[#2b8cee]', sizes[size], className)}>
      progress_activity
    </span>
  );
}






