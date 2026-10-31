import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const WEEK_DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

interface DatePickerPopoverProps {
  viewYear: number;
  viewMonth: number;
  selectedDate?: string;
  minDate?: string;
  maxDate?: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (dateStr: string) => void;
  onSelectToday: () => void;
}

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  viewYear,
  viewMonth,
  selectedDate,
  minDate,
  maxDate,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onSelectToday,
}) => {
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  return (
    <div className="absolute top-full left-0 mt-2 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 z-50 w-72 select-none animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Mes anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Mes siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEK_DAYS.map((day) => (
          <span key={day} className="text-slate-400 dark:text-slate-500 text-xs font-semibold text-center py-1">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3">
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-8 w-8" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const monthStr = String(viewMonth + 1).padStart(2, '0');
          const dayStr = String(dayNum).padStart(2, '0');
          const dateStr = `${viewYear}-${monthStr}-${dayStr}`;

          const isSelected = selectedDate === dateStr;
          const isDisabled = Boolean((minDate && dateStr < minDate) || (maxDate && dateStr > maxDate));

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(dateStr)}
              className={`h-8 w-8 rounded-lg text-xs font-medium flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : isDisabled
                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex justify-end">
        <button
          type="button"
          onClick={onSelectToday}
          className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-center"
        >
          Hoy
        </button>
      </div>
    </div>
  );
};
