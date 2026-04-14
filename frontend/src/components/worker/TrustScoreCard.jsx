import React from 'react';

/**
 * @param {{ score: number }} props
 */
export default function TrustScoreCard({ score }) {
  const percentage = Math.max(0, Math.min(100, score || 0));
  return (
    <section className="bg-white border border-[#E8DDD4] rounded-2xl p-5 flex items-center gap-6">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90">
          <circle cx="48" cy="48" r="42" stroke="#E7E5E4" strokeWidth="8" fill="none" />
          <circle
            cx="48"
            cy="48"
            r="42"
            stroke="#7C3AED"
            strokeWidth="8"
            fill="none"
            strokeDasharray={264}
            strokeDashoffset={264 - (264 * percentage) / 100}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[#1C1917]">{percentage}</div>
      </div>
      <div>
        <p className="font-semibold text-[#1C1917]">{percentage >= 80 ? 'Excellent Standing' : percentage >= 60 ? 'Good Standing' : 'Needs Improvement'}</p>
        <ul className="text-sm text-[#78716C] mt-2 space-y-1">
          <li>✓ No fraud flags</li>
          <li>✓ Consistent check-ins</li>
          <li>✓ Low claim variance</li>
        </ul>
      </div>
    </section>
  );
}
