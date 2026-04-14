import React from 'react';

/**
 * @param {{ amount: number, trendText: string, locationText: string, onViewPayouts: () => void }} props
 */
export default function EarningsHeroBanner({ amount, trendText, locationText, onViewPayouts }) {
  return (
    <section className="bg-gradient-to-r from-[#FFF8F0] to-[#FEF3E2] border border-[#E8DDD4] rounded-2xl p-6">
      <p className="text-sm text-[#78716C]">Protected this month</p>
      <p className="text-5xl font-bold text-[#1C1917] mt-1">₹{amount.toLocaleString()}</p>
      <div className="inline-flex mt-3 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">{trendText}</div>
      <p className="text-sm text-[#78716C] mt-3">{locationText}</p>
      <button
        onClick={onViewPayouts}
        className="mt-4 px-4 py-2 rounded-lg bg-[#F97316] text-white hover:bg-[#C2410C] transition-colors"
      >
        View My Payouts →
      </button>
    </section>
  );
}
