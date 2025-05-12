import React from 'react';

interface CurrencyFilterProps {
  currencies: string[];
  selected: string;
  onChange: (currency: string) => void;
}

export default function CurrencyFilter({ currencies, selected, onChange }: CurrencyFilterProps) {
  return (
    <select
      className="px-2 py-1 border rounded"
      value={selected}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">All Currencies</option>
      {currencies.map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
