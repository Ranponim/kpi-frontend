/**
 * Combobox (드롭다운 선택) 컴포넌트
 */

import { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

export default function Combobox({
  label,
  value,
  onChange,
  options = [],
  placeholder = '선택하세요',
  icon,
  searchable = true,
  allowCustom = true,
  disabled = false,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        if (search && allowCustom) onChange(search);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [search, allowCustom, onChange]);
  
  const filteredOptions = options.filter((option) => {
    const optionLabel = typeof option === 'string' ? option : option.label;
    const optionValue = typeof option === 'string' ? option : option.value;
    const searchLower = search.toLowerCase();
    return optionLabel.toLowerCase().includes(searchLower) || optionValue.toLowerCase().includes(searchLower);
  });
  
  const handleSelect = (option) => {
    const optionValue = typeof option === 'string' ? option : option.value;
    onChange(optionValue);
    setSearch('');
    setIsOpen(false);
  };
  
  const handleFocus = () => {
    setIsOpen(true);
    setSearch(value || '');
  };
  
  const handleInputChange = (e) => {
    setSearch(e.target.value);
    setIsOpen(true);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) handleSelect(filteredOptions[0]);
      else if (allowCustom && search) { onChange(search); setSearch(''); setIsOpen(false); }
    } else if (e.key === 'Escape') { setIsOpen(false); setSearch(''); }
  };
  
  const displayValue = isOpen ? search : value || '';
  
  return (
    <div className={cn('flex flex-col', className)} ref={containerRef}>
      {label && <label className="text-white text-sm font-medium mb-2">{label}</label>}
      <div className="relative">
        {icon && <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</span>}
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full h-12 rounded-lg bg-[#192633] border border-[#324d67]',
            'text-white placeholder:text-slate-400',
            'focus:outline-none focus:border-[#2b8cee] focus:ring-2 focus:ring-[#2b8cee]/30',
            'transition-colors',
            icon ? 'pl-12 pr-10' : 'pl-4 pr-10',
            disabled && 'opacity-70 cursor-not-allowed'
          )}
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
        >
          <span className="material-symbols-outlined">{isOpen ? 'expand_less' : 'expand_more'}</span>
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#192633] border border-slate-200/10 rounded-lg shadow-2xl overflow-hidden animate-fadeIn max-h-64 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : option.label;
                const isSelected = optionValue === value;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={cn(
                      'w-full px-4 py-3 text-left text-sm hover:bg-slate-700/50 transition-colors flex items-center justify-between',
                      isSelected ? 'bg-[#2b8cee]/20 text-[#2b8cee]' : 'text-slate-300'
                    )}
                  >
                    <span>{optionLabel}</span>
                    {isSelected && <span className="material-symbols-outlined text-lg">check</span>}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm text-slate-400">
                {allowCustom && search ? <span>Enter를 눌러 "<span className="text-white">{search}</span>" 사용</span> : '결과 없음'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



