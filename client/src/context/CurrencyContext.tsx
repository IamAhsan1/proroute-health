import React, { createContext, useContext, useState, useEffect } from 'react';

export type Currency = 'PKR' | 'USD';

export const FALLBACK_USD_TO_PKR_RATE = 280;
const FOREX_CACHE_KEY = 'proroute-forex-cache';
const FOREX_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

export interface FormatFeeOptions {
  showSecondary?: boolean;
  compact?: boolean;
}

export interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  toggleCurrency: () => void;
  formatFee: (feeInUsd: number | string | null | undefined, options?: FormatFeeOptions) => string;
  convertToActive: (feeInUsd: number | string | null | undefined) => number;
  rate: number;
  isLiveRate: boolean;
}

export const formatFeeWithCurrency = (
  feeInUsd: number | string | null | undefined,
  currency: Currency,
  rate: number = FALLBACK_USD_TO_PKR_RATE,
  options?: FormatFeeOptions
): string => {
  if (feeInUsd === null || feeInUsd === undefined) return 'Free';
  const num = typeof feeInUsd === 'string' ? parseFloat(feeInUsd) : feeInUsd;
  if (isNaN(num) || num <= 0) return 'Free';

  const { showSecondary = false } = options || {};

  if (currency === 'PKR') {
    const pkrAmount = Math.round(num * rate);
    const primary = `Rs. ${pkrAmount.toLocaleString('en-PK')}`;
    if (showSecondary) {
      return `${primary} ($${num.toFixed(2)})`;
    }
    return primary;
  }

  // USD
  const primary = `$${num.toFixed(2)}`;
  if (showSecondary) {
    const pkrAmount = Math.round(num * rate);
    return `${primary} (~Rs. ${pkrAmount.toLocaleString('en-PK')})`;
  }
  return primary;
};

const defaultContextValue: CurrencyContextType = {
  currency: 'USD',
  setCurrency: () => {},
  toggleCurrency: () => {},
  formatFee: (fee, options) => formatFeeWithCurrency(fee, 'USD', FALLBACK_USD_TO_PKR_RATE, options),
  convertToActive: (fee) => {
    const num = typeof fee === 'string' ? parseFloat(fee) : Number(fee) || 0;
    return num;
  },
  rate: FALLBACK_USD_TO_PKR_RATE,
  isLiveRate: false,
};

export const CurrencyContext = createContext<CurrencyContextType>(defaultContextValue);

interface CurrencyProviderProps {
  children: React.ReactNode;
  defaultCurrency?: Currency;
  storageKey?: string;
}

interface CachedForex {
  rate: number;
  timestamp: number;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({
  children,
  defaultCurrency = 'PKR',
  storageKey = 'proroute-currency',
}) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'PKR' || saved === 'USD') return saved;
    } catch {
      // Fallback
    }
    return defaultCurrency;
  });

  const [rate, setRate] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(FOREX_CACHE_KEY);
      if (raw) {
        const parsed: CachedForex = JSON.parse(raw);
        if (parsed.rate && typeof parsed.rate === 'number' && parsed.rate > 0) {
          return parsed.rate;
        }
      }
    } catch {
      // Fallback
    }
    return FALLBACK_USD_TO_PKR_RATE;
  });

  const [isLiveRate, setIsLiveRate] = useState<boolean>(false);

  // Fetch live exchange rate in background with 1-hour cache TTL
  useEffect(() => {
    let isMounted = true;

    const fetchLiveRate = async () => {
      try {
        const raw = localStorage.getItem(FOREX_CACHE_KEY);
        if (raw) {
          const parsed: CachedForex = JSON.parse(raw);
          const isFresh = Date.now() - parsed.timestamp < FOREX_CACHE_TTL_MS;
          if (isFresh && parsed.rate > 0) {
            if (isMounted) {
              setRate(parsed.rate);
              setIsLiveRate(true);
            }
            return;
          }
        }

        // Fetch fresh rates from open exchange API
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) return;

        const data = await res.json();
        const pkrRate = data?.rates?.PKR;

        if (typeof pkrRate === 'number' && pkrRate > 100 && isMounted) {
          const roundedRate = Math.round(pkrRate * 100) / 100; // e.g. 278.45
          setRate(roundedRate);
          setIsLiveRate(true);
          try {
            const cachePayload: CachedForex = {
              rate: roundedRate,
              timestamp: Date.now(),
            };
            localStorage.setItem(FOREX_CACHE_KEY, JSON.stringify(cachePayload));
          } catch {
            // Storage quota or disabled
          }
        }
      } catch {
        // Network offline or blocked by sandbox — gracefully stays on fallback
      }
    };

    fetchLiveRate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, currency);
    } catch {
      // Fallback
    }
  }, [currency, storageKey]);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
  };

  const toggleCurrency = () => {
    setCurrencyState((prev) => (prev === 'USD' ? 'PKR' : 'USD'));
  };

  const convertToActive = (feeInUsd: number | string | null | undefined): number => {
    if (feeInUsd === null || feeInUsd === undefined) return 0;
    const num = typeof feeInUsd === 'string' ? parseFloat(feeInUsd) : feeInUsd;
    if (isNaN(num) || num <= 0) return 0;

    if (currency === 'PKR') {
      return Math.round(num * rate);
    }
    return num;
  };

  const formatFee = (
    feeInUsd: number | string | null | undefined,
    options?: FormatFeeOptions
  ): string => {
    return formatFeeWithCurrency(feeInUsd, currency, rate, options);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        formatFee,
        convertToActive,
        rate,
        isLiveRate,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
