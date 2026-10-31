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
  openUpwards?: boolean;
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
  openUpwards = false,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onSelectToday,
}) => {
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div
      className={`absolute z-[60] w-60 bg-white border border-slate-200 rounded-xl shadow-xl p-3 select-none right-0 sm:left-0 sm:right-auto animate-in fade-in duration-150 ${
        openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Mes anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-bold text-slate-800">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Mes siguiente"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1.5">
        {WEEK_DAYS.map((day) => (
          <span key={day} className="text-slate-400 text-[10px] font-semibold text-center py-0.5">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-7 w-7" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const monthStr = String(viewMonth + 1).padStart(2, '0');
          const dayStr = String(dayNum).padStart(2, '0');
          const dateStr = `${viewYear}-${monthStr}-${dayStr}`;

          const isSelected = selectedDate === dateStr;
          const isToday = todayStr === dateStr;
          const isDisabled = Boolean((minDate && dateStr < minDate) || (maxDate && dateStr > maxDate));

          const dayStyle = isSelected
            ? 'bg-indigo-600 text-white font-bold shadow-xs'
            : isDisabled
            ? 'text-slate-300 cursor-not-allowed'
            : isToday
            ? 'border border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50/50'
            : 'text-slate-700 hover:bg-slate-100 font-medium';

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(dateStr)}
              className={`h-7 w-7 rounded-md text-xs flex items-center justify-center transition-colors ${dayStyle}`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      <div className="border-t border-slate-100 pt-2 flex justify-end">
        <button
          type="button"
          onClick={onSelectToday}
          className="w-full py-1 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-center"
        >
          Hoy
        </button>
      </div>
    </div>
  );
};
