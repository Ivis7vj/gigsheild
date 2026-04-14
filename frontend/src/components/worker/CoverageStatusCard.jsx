import React from 'react';

/**
 * @param {{ isActive: boolean, premium: number, coverageUntil: string }} props
 */
export default function CoverageStatusCard({ isActive, premium, coverageUntil }) {
  return (
    <section className="bg-white border border-[#E8DDD4] border-l-4 rounded-2xl p-5" style={{ borderLeftColor: isActive ? '#16A34A' : '#DC2626' }}>
      <div className="flex justify-between items-center">
        <p className="font-semibold text-[#1C1917]">{isActive ? 'Coverage Active' : 'Coverage Inactive'}</p>
        <p className="text-sm text-[#78716C]">Until {coverageUntil}</p>
      </div>
      <p className="mt-2 text-sm text-[#78716C]">
        This week: <span className="font-semibold text-[#1C1917]">₹{premium}</span>
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        {['🌧 Rain', '🌡 Heat', '🚧 Traffic', '📵 App Down', '🚫 Curfew'].map((item) => (
          <span key={item} className="px-2 py-1 text-xs rounded-full bg-[#FFF8F0] border border-[#E8DDD4] text-[#78716C]">{item}</span>
        ))}
      </div>
    </section>
  );
}
