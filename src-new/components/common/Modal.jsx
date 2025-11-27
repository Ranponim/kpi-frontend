/**
 * 모달 컴포넌트
 */

import { useEffect } from 'react';
import { cn } from '../../lib/utils';

export default function Modal({ isOpen, onClose, title, children, size = 'md', className }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className={cn(
        'relative w-full mx-4 bg-[#111a22] rounded-xl border border-slate-200/10',
        'shadow-2xl animate-slideUp max-h-[90vh] overflow-hidden flex flex-col',
        sizes[size], className
      )}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/10">
            <h2 className="text-white text-xl font-semibold">{title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}






