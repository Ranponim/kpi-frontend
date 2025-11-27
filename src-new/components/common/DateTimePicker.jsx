/**
 * 날짜/시간 선택 컴포넌트
 */

import { useState, useEffect, useRef } from 'react';
import { format, parse, setHours, setMinutes, isValid } from 'date-fns';
import { cn } from '../../lib/utils';

function roundDownToFiveMinutes(date) {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.floor(minutes / 5) * 5;
  const result = new Date(date);
  result.setMinutes(roundedMinutes);
  result.setSeconds(0);
  result.setMilliseconds(0);
  return result;
}

function generateTimeOptions() {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const h = String(hour).padStart(2, '0');
      const m = String(minute).padStart(2, '0');
      options.push({ value: `${h}:${m}`, label: `${h}:${m}` });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

function Calendar({ selected, onSelect, className }) {
  const [viewDate, setViewDate] = useState(selected || new Date());
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const days = [];
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  
  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  
  const isSelected = (day) => {
    if (!day || !selected) return false;
    return day.getDate() === selected.getDate() && day.getMonth() === selected.getMonth() && day.getFullYear() === selected.getFullYear();
  };
  
  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();
  };
  
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  
  return (
    <div className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-xl">chevron_left</span>
        </button>
        <span className="text-white font-semibold text-base">{year}년 {monthNames[month]}</span>
        <button type="button" onClick={nextMonth} className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-xl">chevron_right</span>
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div key={day} className={cn("text-center text-sm font-medium py-2", index === 0 ? "text-red-400" : index === 6 ? "text-blue-400" : "text-slate-400")}>
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayOfWeek = index % 7;
          return (
            <button
              key={index}
              type="button"
              disabled={!day}
              onClick={() => day && onSelect(day)}
              className={cn(
                'h-10 w-10 text-sm rounded-lg transition-colors font-medium',
                !day && 'invisible',
                day && !isSelected(day) && !isToday(day) && dayOfWeek === 0 && 'text-red-400 hover:bg-slate-700/50',
                day && !isSelected(day) && !isToday(day) && dayOfWeek === 6 && 'text-blue-400 hover:bg-slate-700/50',
                day && !isSelected(day) && !isToday(day) && dayOfWeek !== 0 && dayOfWeek !== 6 && 'text-slate-300 hover:bg-slate-700/50',
                day && isToday(day) && !isSelected(day) && 'text-[#2b8cee] bg-[#2b8cee]/10 font-bold',
                day && isSelected(day) && 'bg-[#2b8cee] text-white font-bold'
              )}
            >
              {day?.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimePicker({ value, onChange, className }) {
  const listRef = useRef(null);
  
  useEffect(() => {
    if (listRef.current && value) {
      const selectedItem = listRef.current.querySelector(`[data-value="${value}"]`);
      if (selectedItem) selectedItem.scrollIntoView({ block: 'center' });
    }
  }, [value]);
  
  return (
    <div className={cn('border-l border-slate-200/10 w-24 h-80 overflow-auto', className)} ref={listRef}>
      <div className="sticky top-0 bg-[#192633] border-b border-slate-200/10 px-3 py-2 text-xs text-slate-400 font-medium">시간 선택</div>
      {TIME_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          data-value={option.value}
          onClick={() => onChange(option.value)}
          className={cn('w-full px-4 py-2.5 text-sm text-center hover:bg-slate-700/50 transition-colors font-medium', value === option.value ? 'bg-[#2b8cee] text-white' : 'text-slate-300')}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function DateTimePicker({ label, value, onChange, placeholder = '날짜/시간 선택', disabled = false, useCurrentTime = false, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('10:00');
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (value) {
      const parsed = parse(value, 'yyyy-MM-dd HH:mm', new Date());
      if (isValid(parsed)) {
        setSelectedDate(parsed);
        setSelectedTime(format(parsed, 'HH:mm'));
      }
    } else if (useCurrentTime) {
      const now = roundDownToFiveMinutes(new Date());
      setSelectedDate(now);
      setSelectedTime(format(now, 'HH:mm'));
      onChange(format(now, 'yyyy-MM-dd HH:mm'));
    }
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const newDate = setMinutes(setHours(date, hours), minutes);
    onChange(format(newDate, 'yyyy-MM-dd HH:mm'));
  };
  
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = setMinutes(setHours(selectedDate, hours), minutes);
      onChange(format(newDate, 'yyyy-MM-dd HH:mm'));
    }
  };
  
  const displayValue = value || placeholder;
  
  return (
    <div className={cn('flex flex-col', className)} ref={containerRef}>
      {label && <label className="text-white text-sm font-medium mb-2">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full h-12 rounded-lg bg-[#192633] border border-[#324d67]',
            'text-left px-4 pl-12 flex items-center justify-between',
            'focus:outline-none focus:border-[#2b8cee] focus:ring-2 focus:ring-[#2b8cee]/30',
            'transition-colors',
            disabled && 'opacity-70 cursor-not-allowed',
            !value && 'text-slate-400',
            value && 'text-white'
          )}
        >
          <span className="material-symbols-outlined absolute left-4 text-slate-400">calendar_today</span>
          <span className="truncate">{displayValue}</span>
          <span className="material-symbols-outlined text-slate-400 ml-2">{isOpen ? 'expand_less' : 'expand_more'}</span>
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-[#192633] border border-slate-200/10 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex">
              <Calendar selected={selectedDate} onSelect={handleDateSelect} className="w-80" />
              <TimePicker value={selectedTime} onChange={handleTimeSelect} />
            </div>
            <div className="flex justify-between items-center gap-2 px-4 py-3 border-t border-slate-200/10 bg-slate-800/30">
              <span className="text-sm text-slate-400">
                {selectedDate && selectedTime ? `${format(selectedDate, 'yyyy-MM-dd')} ${selectedTime}` : '날짜와 시간을 선택하세요'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const now = roundDownToFiveMinutes(new Date());
                    setSelectedDate(now);
                    setSelectedTime(format(now, 'HH:mm'));
                    onChange(format(now, 'yyyy-MM-dd HH:mm'));
                  }}
                  className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  현재 시간
                </button>
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-1.5 text-sm bg-[#2b8cee] text-white rounded-lg hover:bg-[#1a7ad9] transition-colors font-medium">
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}










