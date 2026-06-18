import { useState, useEffect } from 'react';

export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€ ',
  GBP: '£',
};

export const EXCHANGE_RATES = {
  INR: 1.0,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
};

export function getCurrencySymbol() {
  const code = localStorage.getItem('manzil_currency') || 'INR';
  return CURRENCY_SYMBOLS[code] || '₹';
}

export function getCurrencyCode() {
  return localStorage.getItem('manzil_currency') || 'INR';
}

export function convertFromINR(amount) {
  if (amount == null || isNaN(amount)) return 0;
  const code = getCurrencyCode();
  const rate = EXCHANGE_RATES[code] || 1.0;
  return Number((amount * rate).toFixed(code === 'INR' ? 0 : 2));
}

export function convertToINR(amount) {
  if (amount == null || isNaN(amount)) return 0;
  const code = getCurrencyCode();
  const rate = EXCHANGE_RATES[code] || 1.0;
  return Number((amount / rate).toFixed(2));
}

export function formatCurrency(amountInINR) {
  const converted = convertFromINR(amountInINR);
  const code = getCurrencyCode();
  const fractionDigits = code === 'INR' ? 0 : 2;
  return converted.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function useCurrency() {
  const [symbol, setSymbol] = useState(getCurrencySymbol());

  useEffect(() => {
    const handleSettingsChange = () => {
      setSymbol(getCurrencySymbol());
    };

    window.addEventListener('manzil_settings_changed', handleSettingsChange);
    return () => {
      window.removeEventListener('manzil_settings_changed', handleSettingsChange);
    };
  }, []);

  return symbol;
}
