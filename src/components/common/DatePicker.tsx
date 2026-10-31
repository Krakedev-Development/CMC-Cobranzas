import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { DatePickerPopover } from './DatePickerPopover';

export interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

const formatDisplayDate = (val?: string): string => {
  if (!val) return '';
  const [y, m, d] = val.split('-').map(Number);
  if (!y || !m || !d) return val;
  const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
  return `${d} ${months[m - 1] || ''} ${y}`;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  value = '',
  onChange,
  placeholder = 'Seleccionar fecha',
  disabled = false,
  className = '',
  minDate,
  maxDate,
  id,
  name,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    if (value) {
      const parsed = new Date(value + 'T00:00:00');
      if (!isNaN(parsed.getTime())) {
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpwards(spaceBelow < 250 && spaceAbove > spaceBelow);
    }
    setIsOpen((prev) => !prev);
  };

  const changeMonth = (delta: number) => {
    const nextDate = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(nextDate.getFullYear());
    setViewMonth(nextDate.getMonth());
  };

  const handleSelectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setViewYear(y);
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {required && (
        <input
          type="text"
          value={value}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}
      <button
        id={id}
        name={name}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-colors shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''}`}
      >
        <span className={value ? 'font-medium text-slate-800' : 'text-slate-400 font-normal'}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && !disabled && (
        <DatePickerPopover
          viewYear={viewYear}
          viewMonth={viewMonth}
          selectedDate={value}
          minDate={minDate}
          maxDate={maxDate}
          openUpwards={openUpwards}
          onPrevMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
          onSelectDate={handleSelectDate}
          onSelectToday={handleSelectToday}
        />
      )}
    </div>
  );
};
