import React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiRequest, normalizeApiError } from '../api/client';
import { useTranslation } from 'react-i18next';
import GigShieldAssistant from '../components/GigShieldAssistant';
import EarningsHeroBanner from '../components/worker/EarningsHeroBanner';
import CoverageStatusCard from '../components/worker/CoverageStatusCard';
import QuickStatsRow from '../components/worker/QuickStatsRow';
import WeatherAlertBanner from '../components/worker/WeatherAlertBanner';
import TrustScoreCard from '../components/worker/TrustScoreCard';
import RecentClaimsSection from '../components/worker/RecentClaimsSection';
import PayoutTimelineModal from '../components/worker/PayoutTimelineModal';

export default function WorkerDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [claims, setClaims] = useState([]);
  const [trustScore, setTrustScore] = useState(0);
  const [weatherAlert, setWeatherAlert] = useState(null);
  const [mlRisk, setMlRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timelineClaim, setTimelineClaim] = useState(null);

  const totalPaid = useMemo(() => claims.filter((c) => c.status === 'Paid').reduce((sum, c) => sum + (c.payout_amount || 0), 0), [claims]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, policyRes, claimsRes, trustRes, forecastRes] = await Promise.all([
        apiRequest(() => api.get('/workers/profile')),
        apiRequest(() => api.get('/policy/current')),
        apiRequest(() => api.get('/claims/my-claims')),
        apiRequest(() => api.get('/analytics/worker-trust')),
        apiRequest(() => api.get('/triggers/forecast'), { retries: 0 }),
      ]);
      setProfile(profileRes.data);
      setPolicy(policyRes.data);
      setClaims(Array.isArray(claimsRes.data) ? claimsRes.data : []);
      setTrustScore(trustRes.data?.trust_score || 0);
      if (forecastRes.data?.high_risk_today) {
        setWeatherAlert({
          message: `${forecastRes.data.trigger_type || 'Weather disruption'} expected today`,
          zoneText: `${profileRes.data?.zone || 'Zone'} (${profileRes.data?.pincode || 'N/A'})`,
          timeWindow: '14:00 - 17:00 IST',
        });
      } else {
        setWeatherAlert(null);
      }
      const mlRes = await apiRequest(() => api.post('/ml/calculate-risk-score', {
        worker_age: profileRes.data?.age || 30,
        delivery_distance: profileRes.data?.avg_delivery_distance_km || 6,
        weather_risk_score: 45,
        claim_frequency_past_30_days: profileRes.data?.claims_count_30d || 0,
        average_earnings_per_week: profileRes.data?.weekly_earnings || 0,
        zone_safety_rating: 65,
        pincode: profileRes.data?.pincode || null,
      }));
      setMlRisk(mlRes.data);
    } catch (rawError) {
      // #region agent log
      fetch('http://127.0.0.1:7695/ingest/92344bf6-a0bf-478b-ad15-5d0e984edfef',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f473cf'},body:JSON.stringify({sessionId:'f473cf',runId:'dashboard-unreachable',hypothesisId:'H4',location:'frontend/src/pages/WorkerDashboard.jsx:catch',message:'Dashboard fetchAll failed',data:{message:rawError?.message||'unknown',status:rawError?.response?.status||null,hasResponse:Boolean(rawError?.response)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const err = normalizeApiError(rawError, 'Failed to load dashboard');
      if (err.status === 401) {
        navigate('/login');
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const togglePolicy = async () => {
    await apiRequest(() => api.post('/policy/toggle'), { retries: 0 });
    await fetchAll();
  };

  if (loading) return <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">Loading dashboard...</div>;
  if (error) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-red-700">Unable to load dashboard</h2>
          <p className="text-red-600 mt-2">{error}</p>
          <button onClick={fetchAll} className="mt-4 bg-[#F97316] text-white px-4 py-2 rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-[#1C1917]">
      <nav className="bg-white border-b border-[#E8DDD4] px-4 md:px-8 py-3 flex items-center justify-between">
        <div>
          <p className="font-bold text-[#C2410C] text-xl">{t('appName')}</p>
          <p className="text-sm text-[#78716C]">{profile?.full_name} • {profile?.platform}</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="px-3 py-1 rounded-full text-sm bg-[#7C3AED] text-white">{trustScore} ★</span>
          <select
            className="px-2 py-1 rounded-lg border border-[#E8DDD4] text-sm"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            aria-label="Select language"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="ta">தமிழ்</option>
          </select>
          <button
            onClick={() => {
              localStorage.removeItem('access_token');
              localStorage.removeItem('worker_id');
              navigate('/login');
            }}
            className="px-3 py-1.5 rounded-lg border border-[#E8DDD4] text-[#78716C]"
          >
            {t('logout')}
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        <EarningsHeroBanner
          amount={totalPaid}
          trendText="↑ +₹500 vs last month"
          locationText={`${profile?.zone || 'Zone'} · ${profile?.pincode || 'N/A'} · ${profile?.city || 'City'}`}
          onViewPayouts={() => document.getElementById('claims')?.scrollIntoView({ behavior: 'smooth' })}
        />

        <CoverageStatusCard
          isActive={policy?.status === 'Active'}
          premium={policy?.premium || 0}
          coverageUntil={policy?.week_end ? new Date(policy.week_end).toLocaleDateString() : 'N/A'}
        />

        <button
          onClick={togglePolicy}
          className="px-4 py-2 rounded-lg bg-[#F97316] text-white hover:bg-[#C2410C] transition-colors"
          aria-label="Toggle policy status"
        >
          {policy?.status === 'Active' ? 'Deactivate Policy' : 'Activate Policy'}
        </button>

        <QuickStatsRow
          claimsSubmitted={claims.length}
          claimsApproved={claims.filter((c) => c.status === 'Approved' || c.status === 'Paid').length}
          totalPaid={totalPaid}
        />

        <WeatherAlertBanner alert={weatherAlert} />
        <TrustScoreCard score={trustScore} />
        {mlRisk && (
          <section className="bg-white border border-[#E8DDD4] rounded-2xl p-4">
            <p className="font-semibold text-[#1C1917]">ML Risk Score: {mlRisk.score}/100</p>
            <p className="text-sm text-[#78716C] mt-1">Top factors: {(mlRisk.reasoning || []).join(' · ')}</p>
          </section>
        )}
        <div id="claims">
          <RecentClaimsSection claims={claims} onOpenTimeline={setTimelineClaim} />
        </div>
      </main>

      <PayoutTimelineModal claim={timelineClaim} onClose={() => setTimelineClaim(null)} />
      <GigShieldAssistant userType="worker" contextWorkerId={profile?.worker_id} />
    </div>
  );
}
