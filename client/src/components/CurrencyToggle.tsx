import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { DollarSign } from 'lucide-react';

interface CurrencyToggleProps {
  className?: string;
  showIcon?: boolean;
}

export const CurrencyToggle: React.FC<CurrencyToggleProps> = ({
  className = '',
  showIcon = false,
}) => {
  const { currency, setCurrency } = useCurrency();

  return (
    <div
      role="group"
      aria-label="Currency selector"
      className={`inline-flex items-center p-0.5 rounded-xl bg-surface-container-high/70 dark:bg-surface-container border border-surface-container-highest text-xs font-semibold shadow-2xs ${className}`}
    >
      {showIcon && (
        <span className="pl-2 pr-1 text-on-surface-variant flex items-center">
          <DollarSign className="w-3.5 h-3.5" />
        </span>
      )}
      <button
        type="button"
        onClick={() => setCurrency('PKR')}
        className={`px-2 py-1 rounded-lg transition-all duration-150 cursor-pointer ${
          currency === 'PKR'
            ? 'bg-primary text-on-primary shadow-xs font-bold scale-[1.02]'
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/60'
        }`}
        title="Display prices in Pakistani Rupees (PKR)"
        aria-pressed={currency === 'PKR'}
      >
        PKR
      </button>
      <button
        type="button"
        onClick={() => setCurrency('USD')}
        className={`px-2 py-1 rounded-lg transition-all duration-150 cursor-pointer ${
          currency === 'USD'
            ? 'bg-primary text-on-primary shadow-xs font-bold scale-[1.02]'
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/60'
        }`}
        title="Display prices in US Dollars (USD)"
        aria-pressed={currency === 'USD'}
      >
        USD
      </button>
    </div>
  );
};

export default CurrencyToggle;
