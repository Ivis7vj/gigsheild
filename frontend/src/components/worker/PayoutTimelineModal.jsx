import React from 'react';

/**
 * @param {{ claim: any, onClose: () => void }} props
 */
export default function PayoutTimelineModal({ claim, onClose }) {
  if (!claim) return null;
  const steps = [
    'Claim Submitted',
    'Trigger Verified',
    'Fraud Check Passed',
    'Claim Approved',
    'Payout Initiated',
    'Amount Transferred',
  ];
  return (
    <div className="fixed inset-0 z-[300] bg-black/40 flex items-end md:items-center justify-center">
      <div className="bg-white w-full md:w-[700px] rounded-t-2xl md:rounded-2xl p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#1C1917]">Claim {claim.claim_id} Journey</h3>
          <button onClick={onClose} className="text-[#78716C]" aria-label="Close payout timeline">Close</button>
        </div>
        <div className="mt-4 space-y-2">
          {steps.map((step) => (
            <div key={step} className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-green-600 text-white inline-flex items-center justify-center">✓</span>
              <span className="text-[#1C1917]">{step}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
          ₹{claim.payout_amount} sent to your UPI. UTR: {claim.payout_utr || 'Pending'}.
        </div>
      </div>
    </div>
  );
}
