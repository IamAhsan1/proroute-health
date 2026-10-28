import React from 'react';

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
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by doctor name or clinical focus (e.g., Cardiology, hypertension)..."
          className="w-full bg-surface-container-lowest/90 text-on-surface placeholder:text-outline text-sm rounded-lg pl-10 pr-4 py-3 border border-surface-container-highest focus:outline-none focus:border-primary transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Fee Filter Slider */}
      <div className="md:col-span-4 flex flex-col gap-1.5 bg-surface-container-lowest/60 px-4 py-2.5 rounded-lg border border-surface-container-highest/50">
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
