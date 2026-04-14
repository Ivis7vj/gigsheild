import React from 'react';

/**
 * @param {{ alert: { message: string, timeWindow?: string, zoneText?: string } | null }} props
 */
export default function WeatherAlertBanner({ alert }) {
  if (!alert) return null;

  return (
    <section className="bg-[#FEF3C7] border border-[#D97706] rounded-2xl p-4">
      <p className="font-semibold text-[#7C2D12]">⚠ {alert.message}</p>
      <p className="text-sm text-[#92400E] mt-1">
        {alert.zoneText || 'Your zone'} {alert.timeWindow ? `· ${alert.timeWindow}` : ''} · Your coverage is active.
      </p>
    </section>
  );
}
