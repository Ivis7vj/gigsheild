import React, { useMemo, useState } from 'react';

/**
 * @param {{ claims: any[], onOpenTimeline: (claim: any) => void }} props
 */
export default function RecentClaimsSection({ claims, onOpenTimeline }) {
  const [tab, setTab] = useState('All');
  const filtered = useMemo(() => {
    if (tab === 'All') return claims;
    if (tab === 'Pending') return claims.filter((c) => c.status === 'Review' || c.status === 'Initiated');
    return claims.filter((c) => c.status === 'Paid' || c.status === 'Approved');
  }, [claims, tab]);

  const badgeClass = (status) => {
    if (status === 'Paid') return 'bg-[#F97316] text-white';
    if (status === 'Approved') return 'bg-green-100 text-green-700';
    if (status === 'Rejected') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <section className="bg-white border border-[#E8DDD4] rounded-2xl p-5">
      <div className="flex gap-4 border-b border-[#E8DDD4] pb-2 mb-3">
        {['All', 'Pending', 'Paid'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm pb-1 ${tab === t ? 'text-[#F97316] border-b-2 border-[#F97316] font-semibold' : 'text-[#78716C]'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.slice(0, 5).map((claim) => (
          <button
            key={claim.claim_id}
            onClick={() => onOpenTimeline(claim)}
            className="w-full text-left border border-[#E8DDD4] rounded-xl p-3 flex justify-between items-center hover:bg-[#FFF8F0] transition-colors"
          >
            <div>
              <p className="font-semibold text-[#1C1917]">{claim.claim_id}</p>
              <p className="text-xs text-[#78716C]">{new Date(claim.triggered_at).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full ${badgeClass(claim.status)}`}>{claim.status}</span>
              <p className="text-sm font-semibold text-[#1C1917] mt-1">₹{claim.payout_amount || 0}</p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && <p className="text-sm text-[#78716C]">No claims in this tab.</p>}
      </div>
    </section>
  );
}
