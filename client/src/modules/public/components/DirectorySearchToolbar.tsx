import React from 'react';
import { Search, X } from 'lucide-react';

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
      {/* Search Input */}
      <div className="md:col-span-8 relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by doctor name or clinical focus (e.g., Cardiology, hypertension)..."
          className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm rounded-xl pl-11 pr-10 py-3 border border-surface-container-highest focus:outline-none focus:border-primary transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Fee Filter Slider */}
      <div className="md:col-span-4 flex flex-col gap-1.5 bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-surface-container-highest shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="text-on-surface-variant font-medium">Max Fee</span>
          <span className="font-mono font-bold text-secondary">${maxFee}</span>
        </div>
        <input
          type="range"
          min="20"
          max="500"
          step="10"
          value={maxFee}
          onChange={(e) => onMaxFeeChange(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer h-1.5 bg-surface-container-highest rounded-lg"
        />
      </div>
    </div>
  );
};
