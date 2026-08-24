'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  color?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  onAddNew?: () => void;
  addNewLabel?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  className = '',
  buttonClassName = '',
  disabled = false,
  onAddNew,
  addNewLabel = 'Tambah Baru...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value.toLowerCase() === value.toLowerCase());

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/50 text-xs sm:text-sm font-semibold text-[#111111] transition-all hover:border-black/30 focus:outline-none focus:ring-2 focus:ring-[#111111] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${buttonClassName}`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedOption.color }}
                />
              )}
              <span>{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[11px] font-normal text-[#7F847C]">({selectedOption.sublabel})</span>
              )}
            </>
          ) : (
            <span className="text-[#7F847C] font-normal">{placeholder}</span>
          )}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-[#7F847C] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#111111]' : ''
          }`}
        />
      </button>

      {/* Options Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-black/10 shadow-2xl p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value.toLowerCase() === value.toLowerCase();
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                    isSelected
                      ? 'bg-[#111111] text-[#E4FF6B] shadow-xs'
                      : 'text-[#111111] hover:bg-[#EDEFEB]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: opt.color }}
                      />
                    )}
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span
                        className={`text-[10px] font-normal ${
                          isSelected ? 'text-[#E4FF6B]/80' : 'text-[#7F847C]'
                        }`}
                      >
                        {opt.sublabel}
                      </span>
                    )}
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-[#E4FF6B] shrink-0 ml-2" />}
                </button>
              );
            })}

            {options.length === 0 && (
              <div className="py-3 text-center text-xs text-[#7F847C]">Tidak ada pilihan</div>
            )}
          </div>

          {/* Optional inline Add New button */}
          {onAddNew && (
            <div className="pt-1 mt-1 border-t border-black/5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
                className="w-full flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold text-[#111111] hover:bg-[#111111] hover:text-[#E4FF6B] transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addNewLabel}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
