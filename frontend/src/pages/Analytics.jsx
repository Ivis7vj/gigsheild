import React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiRequest, normalizeApiError } from '../api/client';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function Analytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(() => api.get('/analytics/worker'));
      setData(res.data || {});
    } catch (rawError) {
      const err = normalizeApiError(rawError, 'Unable to fetch analytics.');
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
    loadAnalytics();
  }, [loadAnalytics]);

  const heatmapRows = useMemo(() => {
    const items = data?.calendar_map || [];
    return items.map((item) => {
      const zoneLabel = item.disruption || 'Unknown event';
      const level = /severe|heavy|extreme/i.test(zoneLabel) ? 'high' : 'medium';
      return { ...item, zoneLabel, level };
    });
  }, [data]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading analytics...</div>;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white border border-red-200 rounded-xl p-6 max-w-lg w-full">
          <h1 className="font-bold text-red-700 mb-2">Analytics unavailable</h1>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button onClick={loadAnalytics} className="px-4 py-2 rounded-lg bg-[#1E3A5F] text-white">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fc] min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <button onClick={() => navigate(-1)} className="text-sm text-[#1E3A5F] hover:underline" aria-label="Go back">Back</button>
        <h1 className="text-3xl font-bold text-[#1E3A5F]">Your Risk Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Premiums (Month)</p>
            <p className="text-2xl font-bold text-[#1E3A5F]">₹{data?.total_premium || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Payouts (Month)</p>
            <p className="text-2xl font-bold text-[#22C55E]">₹{data?.total_payout || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Risk Trend (Last 4 Weeks)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.risk_trends || []} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -6 }} />
                <YAxis label={{ value: 'Risk score (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Risk Score']} />
                <Legend verticalAlign="top" />
                <Line type="monotone" dataKey="score" stroke="#FF6B35" strokeWidth={3} name="Risk score (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Disruption Heatmap</h3>
          <p className="text-sm text-gray-500 mb-4">
            Total events in your city this month: <strong>{data?.disruptions_count || 0}</strong>
          </p>
          {!heatmapRows.length ? (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">No disruption events available.</p>
          ) : (
            <div className="space-y-2">
              {heatmapRows.map((item, idx) => (
                <div
                  key={`${item.date}-${idx}`}
                  className={`flex justify-between items-center p-3 rounded-xl border text-sm ${
                    item.level === 'high' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-yellow-50 border-yellow-100 text-yellow-800'
                  }`}
                >
                  <span>{item.date} (Time Zone: IST)</span>
                  <span>{item.zoneLabel}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-3">
            Color scale: yellow = moderate event intensity, red = high event intensity.
          </p>
        </div>
      </div>
    </div>
  );
}
