import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useCurrency } from '../../../context/CurrencyContext';

interface DirectorySearchToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  maxFee: number;
  onMaxFeeChange: (val: number) => void;
}

export const DirectorySearchToolbar: React.FC<DirectorySearchToolbarProps> = ({
  searchQuery,
  onSearchChange,
  maxFee,
  onMaxFeeChange,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { currency, rate } = useCurrency();

  // Global '/' keyboard shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;

      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
      {/* Search Input */}
      <div className="md:col-span-8 relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search doctors by name, specialty, or condition (e.g. Cardiology, migraine)..."
          className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm rounded-xl pl-11 pr-14 py-3 border border-surface-container-highest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 hover:scale-110 active:scale-95 transition-all duration-150 motion-reduce:transform-none cursor-pointer"
            aria-label="Clear search text"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <div className="hidden sm:flex items-center absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-outline bg-surface-container-high rounded border border-surface-container-highest shadow-2xs transition-opacity duration-200">
              /
            </kbd>
          </div>
        )}
      </div>

      {/* Fee Filter Slider */}
      <div className="md:col-span-4 flex flex-col gap-1.5 bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-surface-container-highest shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="text-on-surface-variant font-medium">Max Consultation Fee</span>
          <span className="font-mono font-bold text-secondary text-right">
            {maxFee >= 500
              ? 'Any fee'
              : currency === 'PKR'
              ? `Rs. ${Math.round(maxFee * rate).toLocaleString('en-PK')} ($${maxFee})`
              : `$${maxFee}`}
          </span>
        </div>
        <input
          type="range"
          min="20"
          max="500"
          step="10"
          value={maxFee}
          onChange={(e) => onMaxFeeChange(Number(e.target.value))}
          aria-label="Maximum consultation fee"
          aria-valuemin={20}
          aria-valuemax={500}
          aria-valuenow={maxFee}
          className="w-full accent-primary cursor-pointer h-1.5 bg-surface-container-highest rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>
    </div>
  );
};
