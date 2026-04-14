import React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiRequest, isDebugMode, normalizeApiError } from '../api/client';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Home,
  IndianRupee,
  Loader2,
  LogOut,
  RefreshCw,
  Settings,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'claims', label: 'Claims', icon: ShieldCheck },
  { id: 'safety', label: 'Safety Hub', icon: CheckCircle2 },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
  { id: 'account', label: 'Account', icon: Settings },
];

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=1E3A5F&color=fff&name=GigShield';

function EmptyState({ text }) {
  return <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">{text}</p>;
}

const debugLog = (hypothesisId, message, data = {}, runId = 'dashboard-run') => {
  // #region agent log
  fetch('http://127.0.0.1:7695/ingest/92344bf6-a0bf-478b-ad15-5d0e984edfef', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'f473cf',
    },
    body: JSON.stringify({
      sessionId: 'f473cf',
      runId,
      hypothesisId,
      location: 'src/pages/WorkerDashboard.jsx',
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [claims, setClaims] = useState([]);
  const [risk, setRisk] = useState(null);
  const [trust, setTrust] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingPolicy, setTogglingPolicy] = useState(false);
  const [payingClaimId, setPayingClaimId] = useState(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [debugMode, setDebugMode] = useState(localStorage.getItem('debug_mode') === 'true');

  const logAction = useCallback((action, details = {}) => {
    if (isDebugMode()) console.log('[UI ACTION]', action, details);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    // #region agent log
    debugLog('D1', 'Dashboard refresh started', {
      hasToken: Boolean(localStorage.getItem('access_token')),
      apiBase: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
    });
    // #endregion
    try {
      const [profileRes, policyRes, claimsRes, riskRes, trustRes, forecastRes] = await Promise.all([
        apiRequest(() => api.get('/workers/profile')),
        apiRequest(() => api.get('/policy/current')),
        apiRequest(() => api.get('/claims/my-claims')),
        apiRequest(() => api.get('/analytics/risk-insights')),
        apiRequest(() => api.get('/analytics/worker-trust')),
        apiRequest(() => api.get('/triggers/forecast'), { retries: 0 }),
      ]);
      setProfile(profileRes.data);
      setPolicy(policyRes.data);
      setClaims(Array.isArray(claimsRes.data) ? claimsRes.data : []);
      setRisk(riskRes.data || null);
      setTrust(trustRes.data || null);
      setForecast(forecastRes?.data || null);
      // #region agent log
      debugLog('D2', 'Dashboard refresh succeeded', {
        hasProfile: Boolean(profileRes?.data),
        policyStatus: policyRes?.data?.status || null,
        claimsCount: Array.isArray(claimsRes?.data) ? claimsRes.data.length : -1,
      });
      // #endregion
    } catch (rawError) {
      const err = normalizeApiError(rawError, 'Failed to load dashboard.');
      // #region agent log
      debugLog('D3', 'Dashboard refresh failed', {
        requestUrl: rawError?.config?.url || null,
        status: rawError?.response?.status || null,
        message: rawError?.message || null,
        normalizedMessage: err?.message || null,
      });
      // #endregion
      if (err.status === 401) {
        // #region agent log
        debugLog('D4', 'Dashboard redirecting to login due to 401', {});
        // #endregion
        navigate('/login');
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const totalPaid = useMemo(
    () => claims.filter((c) => c.status === 'Paid').reduce((sum, c) => sum + (c.payout_amount || 0), 0),
    [claims]
  );

  const initials = useMemo(() => {
    if (!profile?.full_name) return 'G';
    return profile.full_name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [profile]);

  const avatarUrl = profile?.avatar_url || profile?.profile_image_url || null;

  async function handleTogglePolicy() {
    logAction('toggle_policy', { currentStatus: policy?.status });
    setTogglingPolicy(true);
    try {
      const { data } = await apiRequest(() => api.post('/policy/toggle'));
      setPolicy((prev) => ({ ...(prev || {}), status: data.status }));
    } catch (rawError) {
      const err = normalizeApiError(rawError, 'Could not update policy state.');
      alert(err.message);
    } finally {
      setTogglingPolicy(false);
    }
  }

  async function handleProcessPayout(claimId) {
    logAction('process_payout', { claimId });
    setPayingClaimId(claimId);
    try {
      await apiRequest(() => api.post(`/claims/${claimId}/process-payout`), { retries: 0 });
      await refreshAll();
    } catch (rawError) {
      const err = normalizeApiError(rawError, 'Unable to process payout.');
      alert(err.message);
    } finally {
      setPayingClaimId(null);
    }
  }

  function logout() {
    logAction('logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('worker_id');
    navigate('/login');
  }

  function toggleDebugMode() {
    const next = !debugMode;
    setDebugMode(next);
    localStorage.setItem('debug_mode', String(next));
    console.log(`[DEBUG MODE] ${next ? 'enabled' : 'disabled'}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-[#1E3A5F]">
        <Loader2 className="w-10 h-10 animate-spin" aria-label="Loading dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white p-6 rounded-2xl border border-red-200">
          <h2 className="text-lg font-bold text-red-700 mb-2">Unable to load dashboard</h2>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={refreshAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E3A5F] text-white"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    logAction('tab_change', { tab: tab.id });
                    setActiveTab(tab.id);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    activeTab === tab.id ? 'bg-[#1E3A5F] text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-label={`Open ${tab.label}`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDebugMode}
              className={`px-3 py-2 rounded-lg text-sm ${debugMode ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}
              aria-label="Toggle debug mode"
            >
              Debug: {debugMode ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={refreshAll}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm inline-flex items-center gap-2"
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={logout} className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm inline-flex items-center gap-2">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">{profile?.full_name || 'Worker'}</h1>
            <p className="text-sm text-gray-500">
              {profile?.worker_id || 'N/A'} • {profile?.city || 'Unknown city'} {profile?.zone ? `• ${profile.zone}` : ''}
            </p>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center overflow-hidden" aria-label="User avatar">
            {avatarUrl && !avatarBroken ? (
              <img
                src={avatarUrl}
                alt={`${profile?.full_name || 'User'} avatar`}
                className="w-full h-full object-cover"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <img src={DEFAULT_AVATAR} alt="Default avatar" className="hidden" />
            )}
            {(!avatarUrl || avatarBroken) && <span className="font-semibold">{initials}</span>}
          </div>
        </section>

        {forecast?.high_risk_today && (
          <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="text-yellow-700 mt-0.5" size={18} />
            <div>
              <p className="font-semibold text-yellow-800">{forecast.trigger_type || 'Risk alert'} expected today</p>
              <p className="text-sm text-yellow-700">Severity: {forecast.severity}. Coverage remains active.</p>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500">Policy</p><p className="text-xl font-bold">{policy?.status || 'Unknown'}</p></div>
            <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500">Trust score</p><p className="text-xl font-bold">{trust?.trust_score ?? '--'}/100</p></div>
            <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500">Claims count</p><p className="text-xl font-bold">{claims.length}</p></div>
            <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500">Paid earnings</p><p className="text-xl font-bold">₹{totalPaid.toFixed(0)}</p></div>
            <div className="md:col-span-4 bg-white rounded-xl border p-4">
              <button
                onClick={handleTogglePolicy}
                disabled={togglingPolicy}
                className="px-4 py-2 rounded-lg bg-[#1E3A5F] text-white disabled:opacity-60 inline-flex items-center gap-2"
              >
                {togglingPolicy ? <Loader2 size={14} className="animate-spin" /> : null}
                {policy?.status === 'Active' ? 'Deactivate policy' : 'Activate policy'}
              </button>
            </div>
          </section>
        )}

        {activeTab === 'analytics' && (
          <section className="bg-white rounded-xl border p-4">
            <h2 className="text-lg font-semibold mb-3">Risk analytics</h2>
            {!risk ? (
              <EmptyState text="No analytics data available right now." />
            ) : (
              <div className="space-y-3">
                <p className="text-sm">City risk: <strong>{risk?.risk_pulse?.city_score ?? 0}%</strong></p>
                <ul className="space-y-2">
                  {(risk?.risk_pulse?.zones || []).map((zone) => (
                    <li key={zone.name} className="text-sm text-gray-700">{zone.name}: {zone.score}% ({zone.level})</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {activeTab === 'claims' && (
          <section className="bg-white rounded-xl border p-4">
            <h2 className="text-lg font-semibold mb-3">Claims</h2>
            {!claims.length ? (
              <EmptyState text="No claim activity found." />
            ) : (
              <div className="space-y-3">
                {claims.map((claim) => (
                  <div key={claim.claim_id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{claim.event_name || claim.trigger_type}</p>
                      <p className="text-xs text-gray-500">{new Date(claim.triggered_at).toLocaleString()} • {claim.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{claim.payout_amount || 0}</p>
                      {claim.status === 'Approved' && claim.payout_status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleProcessPayout(claim.claim_id)}
                          disabled={payingClaimId === claim.claim_id}
                          className="mt-2 px-3 py-1.5 text-xs rounded bg-green-600 text-white disabled:opacity-60"
                        >
                          {payingClaimId === claim.claim_id ? 'Processing...' : 'Process payout'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'safety' && (
          <section className="bg-white rounded-xl border p-4">
            <h2 className="text-lg font-semibold mb-3">Safety hub</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-green-600" /> Identity checks: Verified</li>
              <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-green-600" /> Trigger consistency: {trust?.clean_claims ?? 0} clean claims</li>
              <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-green-600" /> Current trust status: {trust?.trust_score ?? '--'}/100</li>
            </ul>
          </section>
        )}

        {activeTab === 'earnings' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Total paid</p>
              <p className="text-2xl font-bold text-green-600">₹{totalPaid.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Last payout count</p>
              <p className="text-2xl font-bold">{claims.filter((c) => c.status === 'Paid').length}</p>
            </div>
          </section>
        )}

        {activeTab === 'account' && (
          <section className="bg-white rounded-xl border p-4 space-y-3">
            <h2 className="text-lg font-semibold">Account</h2>
            <p className="text-sm text-gray-600"><User size={14} className="inline mr-1" /> Name: {profile?.full_name || 'N/A'}</p>
            <p className="text-sm text-gray-600"><IndianRupee size={14} className="inline mr-1" /> Weekly earnings: ₹{profile?.weekly_earnings || 0}</p>
            <p className="text-sm text-gray-600">UPI: {profile?.upi_id || 'Not configured'}</p>
          </section>
        )}
      </main>
    </div>
  );
}
