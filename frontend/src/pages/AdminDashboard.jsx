import React, { useEffect, useMemo, useState } from 'react';
import api, { apiRequest, normalizeApiError } from '../api/client';
import GigShieldAssistant from '../components/GigShieldAssistant';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { i18n } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [claims, setClaims] = useState([]);
  const [fraud, setFraud] = useState(null);
  const [deep, setDeep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [adminRes, claimsRes, fraudRes, deepRes] = await Promise.all([
        apiRequest(() => api.get('/analytics/admin')),
        apiRequest(() => api.get('/admin/claims')),
        apiRequest(() => api.get('/admin/fraud-dashboard')),
        apiRequest(() => api.get('/admin/analytics/deep')),
      ]);
      setSummary(adminRes.data);
      setClaims(claimsRes.data || []);
      setFraud(fraudRes.data || {});
      setDeep(deepRes.data || {});
    } catch (rawError) {
      setError(normalizeApiError(rawError, 'Failed to load admin dashboard').message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const healthScore = useMemo(() => deep?.portfolio_health || 0, [deep]);
  const predictiveData = useMemo(
    () => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => ({ day, claims: Math.max(10, (deep?.predicted_claims_next_week || 20) + idx * 2) })),
    [deep]
  );

  const handleAction = async (claimId, action) => {
    await apiRequest(() => api.post(`/admin/claims/${claimId}/review?action=${action}`), { retries: 0 });
    await loadData();
  };

  const explainFraud = async (claimId) => {
    const { data } = await apiRequest(() => api.post('/ai-agent/explain-fraud', { claim_id: claimId }), { retries: 0 });
    alert(`${data.explanation_text}\n\n${(data.fraud_signals_plain_english || []).join('\n')}`);
  };

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading admin dashboard...</div>;
  if (error) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-red-700">{error}</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] p-4 md:p-6">
      <header className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1D4ED8]">GigShield Admin</h1>
        <div className="text-sm flex items-center gap-3">
          <select
            className="px-2 py-1 rounded-lg border border-[#E2E8F0]"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            aria-label="Select language"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="ta">தமிழ்</option>
          </select>
          <span>
            Portfolio Health Score: <span className="font-bold text-[#2563EB]">{healthScore}/100</span>
          </span>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <MetricCard label="Total Workers" value={summary?.total_policies || 0} />
        <MetricCard label="Premiums Collected (Week)" value={`₹${(deep?.total_premiums || 0).toLocaleString()}`} />
        <MetricCard label="Payouts (Week)" value={`₹${(deep?.total_payouts || 0).toLocaleString()}`} />
        <MetricCard label="Fraud Claims Flagged" value={summary?.flagged_count || 0} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <h2 className="font-semibold mb-2">Predictive Claims Next Week</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={predictiveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="claims" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <h2 className="font-semibold mb-2">Pincode Hotspots</h2>
          <div className="space-y-2">
            {(deep?.top_pincodes || []).slice(0, 10).map((p) => (
              <div key={p.pincode} className="flex justify-between p-2 bg-slate-50 rounded-lg text-sm">
                <span>{p.pincode}</span>
                <span>{p.count} claims</span>
              </div>
            ))}
            {(deep?.top_pincodes || []).length === 0 && <p className="text-sm text-slate-500">No hotspot data available.</p>}
          </div>
        </div>
      </section>

      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mt-4">
        <h2 className="font-semibold mb-3">Claims Requiring Review</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Claim ID</th>
                <th className="py-2">Worker</th>
                <th className="py-2">Fraud Risk</th>
                <th className="py-2">Top Signal</th>
                <th className="py-2">ML Approval</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.slice(0, 10).map((claim) => {
                const fraudRisk = claim.ml_fraud_risk_score ?? claim.fraud_score ?? 0;
                const riskClass = fraudRisk > 75 ? 'text-red-600' : fraudRisk >= 25 ? 'text-amber-600' : 'text-green-600';
                return (
                  <tr key={claim.claim_id} className="border-b">
                    <td className="py-2">{claim.claim_id?.slice(-8)}</td>
                    <td className="py-2">{claim.worker_id}</td>
                    <td className={`py-2 font-semibold ${riskClass}`}>{fraudRisk}%</td>
                    <td className="py-2">{claim.ml_fraud_reasoning?.[0] || claim.fraud_factors?.[0] || 'Pattern variance'}</td>
                    <td className="py-2">{claim.ml_approval_probability || 0}%</td>
                    <td className="py-2 space-x-2">
                      <button onClick={() => handleAction(claim.claim_id, 'approved')} className="px-2 py-1 bg-green-100 text-green-700 rounded">Approve</button>
                      <button onClick={() => handleAction(claim.claim_id, 'rejected')} className="px-2 py-1 bg-red-100 text-red-700 rounded">Reject</button>
                      <button onClick={() => explainFraud(claim.claim_id)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Ask Agent</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <MetricCard label="Total Flagged" value={summary?.flagged_count || 0} />
        <MetricCard label="Under Review" value={fraud?.under_review || 0} />
        <MetricCard label="Escalated" value={fraud?.escalated || 0} />
        <MetricCard label="Fraud Rate" value={`${deep?.fraud_rate || 0}%`} />
      </section>

      <GigShieldAssistant userType="admin" />
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
      <p className="text-sm text-[#64748B]">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
