import React from 'react';

/**
 * @param {{ claimsSubmitted: number, claimsApproved: number, totalPaid: number }} props
 */
export default function QuickStatsRow({ claimsSubmitted, claimsApproved, totalPaid }) {
  const cards = [
    { label: 'Claims Filed', value: claimsSubmitted, color: 'text-[#1C1917]' },
    { label: 'Approved', value: claimsApproved, color: 'text-[#16A34A]' },
    { label: 'Total Received', value: `₹${totalPaid.toLocaleString()}`, color: 'text-[#F97316]' },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white border border-[#E8DDD4] rounded-2xl p-4">
          <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-sm text-[#78716C] mt-1">{card.label}</p>
        </div>
      ))}
    </section>
  );
}
