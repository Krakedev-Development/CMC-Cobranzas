import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  menuClassName?: string;
  searchable?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  direction?: 'down' | 'up' | 'auto';
  id?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccione una opción',
  className = '',
  menuClassName = '',
  searchable = false,
  disabled = false,
  size = 'md',
  direction = 'auto',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [effectiveDirection, setEffectiveDirection] = useState<'down' | 'up'>(
    direction === 'up' ? 'up' : 'down'
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronous active direction: if explicitly 'up' or 'down', use it immediately!
  const activeDirection = direction !== 'auto' ? direction : effectiveDirection;

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && direction === 'auto' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If cramped below and more space above, open upwards
      setEffectiveDirection(spaceBelow < 220 && spaceAbove > spaceBelow ? 'up' : 'down');
    }
    setIsOpen((prev) => !prev);
  };

  const filteredOptions = searchable && searchTerm.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.sublabel?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs rounded-xl'
      : 'px-3.5 py-2 text-xs rounded-xl';

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`} id={id}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-medium transition-all shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${
          isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''
        }`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon}
          <span className="truncate font-semibold text-slate-800">
            {selectedOption ? selectedOption.label : <span className="text-slate-400 font-normal">{placeholder}</span>}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
              {selectedOption.badge}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen
              ? activeDirection === 'up'
                ? '-rotate-180 text-indigo-600'
                : 'rotate-180 text-indigo-600'
              : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-[100] w-full min-w-[140px] max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 py-1 right-0 sm:left-0 sm:right-auto ${
            activeDirection === 'up'
              ? 'bottom-full mb-1.5'
              : 'top-full mt-1.5'
          } ${menuClassName}`}
          style={{ minWidth: '140px' }}
        >
          {searchable && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-slate-400 text-center italic">
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/80 text-indigo-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon}
                      <div className="truncate">
                        <div className="truncate">{opt.label}</div>
                        {opt.sublabel && (
                          <div className="text-[10px] text-slate-400 font-normal truncate">
                            {opt.sublabel}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
