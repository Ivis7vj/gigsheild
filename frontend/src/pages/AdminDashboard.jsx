import { useState, useEffect } from 'react';
import api, { apiRequest, isDebugMode, normalizeApiError } from '../api/client';
import {
  ShieldAlert, Users, TrendingUp, AlertOctagon, RefreshCw,
  PieChart, BarChart3, MapPin, Activity, DollarSign,
  CheckCircle, XCircle, Clock, Eye, Flag, ArrowUpRight,
  Thermometer, CloudRain, Wind, Gauge
} from 'lucide-react';
import {
  PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
  AreaChart, Area, ComposedChart, Legend
} from 'recharts';

const COLORS = ['#1E3A5F', '#FF6B35', '#22C55E', '#FBBF24', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [claims, setClaims] = useState([]);
  const [triggerLog, setTriggerLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview'); // overview, fraud, analytics
  const [fraudData, setFraudData] = useState(null);
  const [deepAnalytics, setDeepAnalytics] = useState(null);
  const [selectedClaim] = useState(null);
  const [error, setError] = useState(null);
  const [runningTriggers, setRunningTriggers] = useState(false);
  const [actingClaimId, setActingClaimId] = useState(null);

  const fetchAdminData = async () => {
    try {
      setError(null);
      const [analytics, c] = await Promise.all([
        apiRequest(() => api.get('/analytics/admin')),
        apiRequest(() => api.get('/admin/claims'))
      ]);
      setData(analytics.data);
      setClaims(c.data);
    } catch (err) {
      const normalized = normalizeApiError(err, 'Failed to load admin dashboard');
      setError(normalized.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFraudData = async () => {
    try {
      const res = await apiRequest(() => api.get('/admin/fraud-dashboard'));
      setFraudData(res.data);
    } catch (err) {
      console.error('Fraud data error:', err);
    }
  };

  const fetchDeepAnalytics = async () => {
    try {
      const res = await apiRequest(() => api.get('/admin/analytics/deep'));
      setDeepAnalytics(res.data);
    } catch (err) {
      console.error('Deep analytics error:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchFraudData();
    fetchDeepAnalytics();
  }, []);

  const runTriggers = async () => {
    setRunningTriggers(true);
    try {
      if (isDebugMode()) console.log('[UI ACTION] run_triggers');
      const res = await apiRequest(() => api.post('/triggers/run-all'), { retries: 0 });
      setTriggerLog(res.data.logs.length ? res.data.logs : ['No new triggers fired.']);
      fetchAdminData();
    } catch (err) {
      const normalized = normalizeApiError(err, 'Unable to run triggers');
      setTriggerLog([normalized.message]);
    } finally {
      setRunningTriggers(false);
    }
  };

  const handleClaimAction = async (claimId, action) => {
    try {
      if (isDebugMode()) console.log('[UI ACTION] claim_action', { claimId, action });
      setActingClaimId(claimId);
      await apiRequest(() => api.post(`/admin/claims/${claimId}/review?action=${action}`), { retries: 0 });
      await fetchAdminData();
      await fetchFraudData();
    } catch (err) {
      console.error('Claim action error:', normalizeApiError(err).message);
    } finally {
      setActingClaimId(null);
    }
  };

  if (loading) return <div className="text-center p-20">Loading Admin Dashboard...</div>;

  // Fraud Dashboard View
  if (activeView === 'fraud') {
    return (
      <div className="bg-[#f8f9fc] min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1E3A5F]">Fraud Detection Dashboard</h1>
              <p className="text-sm text-gray-500">Advanced fraud analytics and claim verification</p>
            </div>
            <button
              onClick={() => setActiveView('overview')}
              className="bg-[#1E3A5F] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1E3A5F]/90 transition"
            >
              Back to Overview
            </button>
          </div>

          {/* Fraud Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <ShieldAlert size={20} />
                </div>
                <span className="text-sm text-gray-500">High Risk Claims</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {fraudData?.score_distribution?.high_risk || 0}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-xl">
                  <AlertOctagon size={20} />
                </div>
                <span className="text-sm text-gray-500">Medium Risk</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {fraudData?.score_distribution?.medium_risk || 0}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                  <CheckCircle size={20} />
                </div>
                <span className="text-sm text-gray-500">Low Risk</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {fraudData?.score_distribution?.low_risk || 0}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Eye size={20} />
                </div>
                <span className="text-sm text-gray-500">Under Review</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {fraudData?.under_review || 0}
              </p>
            </div>
          </div>

          {/* Fraud Score Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Fraud Score Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Low Risk (0-30)', value: fraudData?.score_distribution?.low_risk || 0 },
                    { name: 'Medium Risk (31-60)', value: fraudData?.score_distribution?.medium_risk || 0 },
                    { name: 'High Risk (61-100)', value: fraudData?.score_distribution?.high_risk || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 11}} angle={-15} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Claims by Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(fraudData?.status_counts || {}).map(([name, value]) => ({ name, value }))}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(fraudData?.status_counts || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* High Risk Claims Leaderboard */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">High Risk Claims Leaderboard</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 font-semibold text-gray-600">Claim ID</th>
                  <th className="pb-3 font-semibold text-gray-600">Worker</th>
                  <th className="pb-3 font-semibold text-gray-600">Trigger</th>
                  <th className="pb-3 font-semibold text-gray-600">Fraud Score</th>
                  <th className="pb-3 font-semibold text-gray-600">GPS Score</th>
                  <th className="pb-3 font-semibold text-gray-600">Weather</th>
                  <th className="pb-3 font-semibold text-gray-600">Behavior</th>
                  <th className="pb-3 font-semibold text-gray-600">Status</th>
                  <th className="pb-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fraudData?.high_risk_claims?.map((claim) => (
                  <tr key={claim.claim_id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 font-mono text-xs">{claim.claim_id?.slice(-8)}</td>
                    <td className="py-3 font-medium">{claim.worker_name}</td>
                    <td className="py-3">{claim.trigger_type}</td>
                    <td className="py-3">
                      <span className={`font-bold ${
                        claim.fraud_score > 60 ? 'text-red-600' :
                        claim.fraud_score > 30 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {claim.fraud_score}
                      </span>
                    </td>
                    <td className="py-3 text-xs">{claim.gps_fraud_score || 0}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        claim.weather_verification === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                        claim.weather_verification === 'MISMATCH' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {claim.weather_verification || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        claim.behavioral_risk === 'HIGH' ? 'bg-red-100 text-red-700' :
                        claim.behavioral_risk === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {claim.behavioral_risk || 'LOW'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded font-bold ${
                        claim.status === 'Flagged' ? 'bg-red-100 text-red-700' :
                        claim.status === 'Review' ? 'bg-yellow-100 text-yellow-700' :
                        claim.status === 'Paid' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleClaimAction(claim.claim_id, 'reviewed')}
                          disabled={actingClaimId === claim.claim_id}
                          className="p-1 hover:bg-blue-100 rounded text-blue-600"
                          title="Mark as Reviewed"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleClaimAction(claim.claim_id, 'escalated')}
                          disabled={actingClaimId === claim.claim_id}
                          className="p-1 hover:bg-orange-100 rounded text-orange-600"
                          title="Escalate"
                        >
                          <Flag size={16} />
                        </button>
                        <button
                          onClick={() => handleClaimAction(claim.claim_id, 'approved')}
                          disabled={actingClaimId === claim.claim_id}
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          title="Approve"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleClaimAction(claim.claim_id, 'rejected')}
                          disabled={actingClaimId === claim.claim_id}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="Reject"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!fraudData?.high_risk_claims || fraudData.high_risk_claims.length === 0) && (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-gray-500">
                      No high-risk claims detected. System is running clean.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Fraud Factors Detail */}
          {selectedClaim && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Fraud Analysis Detail</h3>
              <div className="space-y-3">
                {selectedClaim.fraud_factors?.map((factor, idx) => (
                  <div key={idx} className="p-3 bg-red-50 rounded-xl border border-red-100 text-red-800 text-sm">
                    {factor}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Deep Analytics View
  if (activeView === 'analytics') {
    return (
      <div className="bg-[#f8f9fc] min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1E3A5F]">Insurer Analytics Dashboard</h1>
              <p className="text-sm text-gray-500">Portfolio health, predictive analytics, and risk assessment</p>
            </div>
            <button
              onClick={() => setActiveView('overview')}
              className="bg-[#1E3A5F] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1E3A5F]/90 transition"
            >
              Back to Overview
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <DollarSign size={20} />
                </div>
                <span className="text-sm text-gray-500">Total Premiums</span>
              </div>
              <p className="text-2xl font-bold text-[#1E3A5F]">
                ₹{deepAnalytics?.total_premiums?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                  <TrendingUp size={20} />
                </div>
                <span className="text-sm text-gray-500">Total Payouts</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ₹{deepAnalytics?.total_payouts?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Gauge size={20} />
                </div>
                <span className="text-sm text-gray-500">Loss Ratio</span>
              </div>
              <p className={`text-2xl font-bold ${
                (deepAnalytics?.loss_ratio || 0) > 80 ? 'text-red-600' :
                (deepAnalytics?.loss_ratio || 0) > 50 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {deepAnalytics?.loss_ratio || 0}%
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <ShieldAlert size={20} />
                </div>
                <span className="text-sm text-gray-500">Fraud Rate</span>
              </div>
              <p className={`text-2xl font-bold ${
                (deepAnalytics?.fraud_rate || 0) > 10 ? 'text-red-600' :
                (deepAnalytics?.fraud_rate || 0) > 5 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {deepAnalytics?.fraud_rate || 0}%
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                  <Activity size={20} />
                </div>
                <span className="text-sm text-gray-500">Portfolio Health</span>
              </div>
              <p className={`text-2xl font-bold ${
                (deepAnalytics?.portfolio_health || 0) >= 70 ? 'text-green-600' :
                (deepAnalytics?.portfolio_health || 0) >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {deepAnalytics?.portfolio_health || 0}/100
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Loss Ratio Gauge */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Loss Ratio Analysis</h3>
              <div className="flex items-center justify-center h-48">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke={deepAnalytics?.loss_ratio > 80 ? '#EF4444' : deepAnalytics?.loss_ratio > 50 ? '#FBBF24' : '#22C55E'}
                      strokeWidth="12"
                      strokeDasharray={`${(deepAnalytics?.loss_ratio || 0) * 2.51} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-[#1E3A5F]">{deepAnalytics?.loss_ratio || 0}%</span>
                    <span className="text-xs text-gray-500">Loss Ratio</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-gray-600">
                Payouts: ₹{deepAnalytics?.total_payouts} / Premiums: ₹{deepAnalytics?.total_premiums}
              </div>
            </div>

            {/* Predictive Analytics */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Predictive Analytics</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="text-blue-600" size={20} />
                      <span className="text-sm font-medium text-gray-700">Predicted Claims (Next 7 Days)</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">
                      {deepAnalytics?.predicted_claims_next_week || 0}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="text-green-600" size={20} />
                      <span className="text-sm font-medium text-gray-700">Active Policies</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">
                      {deepAnalytics?.active_policies || 0}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="text-purple-600" size={20} />
                      <span className="text-sm font-medium text-gray-700">Claim Frequency</span>
                    </div>
                    <span className="text-xl font-bold text-purple-600">
                      {deepAnalytics?.claim_frequency || 0} claims/policy
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Claims Heatmap by Pincode */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-[#1E3A5F] mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-red-500" />
              Claims Heatmap by Pincode
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(deepAnalytics?.top_pincodes || []).map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl text-center ${
                    item.count > 5 ? 'bg-red-100 text-red-800' :
                    item.count > 2 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}
                >
                  <p className="text-2xl font-bold">{item.pincode}</p>
                  <p className="text-sm font-medium">{item.count} claims</p>
                </div>
              ))}
              {(deepAnalytics?.top_pincodes || []).length === 0 && (
                <div className="col-span-5 text-center py-8 text-gray-500">
                  No claims data available for heatmap
                </div>
              )}
            </div>
          </div>

          {/* Fraud Risk Summary */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-[#1E3A5F] mb-4 flex items-center gap-2">
              <ShieldAlert size={20} className="text-orange-500" />
              Fraud Risk Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <p className="text-sm text-gray-600 mb-1">Under Review</p>
                <p className="text-2xl font-bold text-yellow-600">{deepAnalytics?.under_review || fraudData?.under_review || 0}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-sm text-gray-600 mb-1">Escalated</p>
                <p className="text-2xl font-bold text-orange-600">{deepAnalytics?.escalated || fraudData?.escalated || 0}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm text-gray-600 mb-1">Fraud Rate</p>
                <p className="text-2xl font-bold text-red-600">{deepAnalytics?.fraud_rate || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default Overview View
  return (
    <div className="bg-[#f8f9fc] min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">GigShield Command Center</h1>
          <button
            onClick={runTriggers}
            disabled={runningTriggers}
            className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#FF6B35]/90 transition disabled:opacity-60"
          >
             <RefreshCw className="w-4 h-4" /> Run Triggers Now
          </button>
        </div>
        {error && <div className="text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg p-3">{error}</div>}

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveView('fraud')}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">Fraud Dashboard</h3>
                <p className="text-sm text-white/80">View high-risk claims, fraud scores, and take action</p>
              </div>
              <ArrowUpRight size={32} className="opacity-50" />
            </div>
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">Insurer Analytics</h3>
                <p className="text-sm text-white/80">Loss ratio, predictions, heatmap, portfolio health</p>
              </div>
              <ArrowUpRight size={32} className="opacity-50" />
            </div>
          </button>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users /></div>
            <div>
              <p className="text-sm text-gray-500">Active Policies</p>
              <p className="text-xl font-bold">{data?.total_policies}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp /></div>
            <div>
              <p className="text-sm text-gray-500">Total Payouts (Month)</p>
              <p className="text-xl font-bold">₹{data?.total_payouts}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl"><ShieldAlert /></div>
            <div>
              <p className="text-sm text-gray-500">Fraud Flagged</p>
              <p className="text-xl font-bold">{data?.flagged_count} <span className="text-sm text-red-500">({data?.fraud_pct}%)</span></p>
            </div>
          </div>
          <div className="bg-[#1E3A5F] text-white p-5 rounded-2xl shadow-sm border border-gray-800 flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl"><AlertOctagon /></div>
            <div>
              <p className="text-sm text-blue-200">System Status</p>
              <p className="text-xl font-bold text-[#22C55E]">All Systems Nominal</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Claims by Trigger Type</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.donut_chart} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {data?.donut_chart.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Top High-Risk Zones</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.top_risk_zones} layout="vertical" margin={{left: 30}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                  <Tooltip />
                  <Bar dataKey="risk" fill="#FF6B35" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Action Logs & Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Manual Trigger Result</h3>
             <ul className="space-y-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-xl min-h-[100px]">
                {triggerLog.map((log, i) => <li key={i}>{log}</li>)}
             </ul>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
             <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Recent Claims Flagged for Review</h3>
             <table className="w-full text-left text-sm text-gray-600">
               <thead>
                 <tr className="border-b">
                   <th className="pb-3">Worker ID</th>
                   <th className="pb-3">Trigger Event</th>
                   <th className="pb-3">Fraud Score</th>
                   <th className="pb-3">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {claims.filter(c => c.status === 'Flagged').map(c => (
                   <tr key={c.claim_id} className="border-b last:border-0 hover:bg-gray-50">
                     <td className="py-3 font-medium">{c.worker_id}</td>
                     <td className="py-3">{c.event_name}</td>
                     <td className="py-3 text-red-500 font-bold">{c.fraud_score}</td>
                     <td className="py-3"><span className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs font-bold">{c.status}</span></td>
                   </tr>
                 ))}
                 {claims.filter(c => c.status === 'Flagged').length === 0 && (
                    <tr><td colSpan="4" className="py-4 text-center">No flagged claims.</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
}
