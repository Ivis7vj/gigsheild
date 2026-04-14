import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft } from 'lucide-react';

export default function Analytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/analytics/worker');
        setData(res.data);
      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="bg-[#f8f9fc] min-h-screen pb-20">
      <div className="bg-[#1E3A5F] px-6 pt-8 pb-16 text-white">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="mb-4 text-blue-200 hover:text-white flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="text-3xl font-bold">Your Risk Analytics</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Premiums (Month)</p>
            <p className="text-2xl font-bold text-[#1E3A5F]">₹{data?.total_premium}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-right">
            <p className="text-gray-500 text-sm mb-1">Payouts (Month)</p>
            <p className="text-2xl font-bold text-[#22C55E]">₹{data?.total_payout}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Risk Trend (Last 4 Weeks)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.risk_trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="score" stroke="#FF6B35" strokeWidth={3} dot={{r: 4, fill: '#FF6B35'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Disruption Calendar Map</h3>
           <p className="text-sm text-gray-500 mb-4">Total events in your city this month: <strong>{data?.disruptions_count}</strong></p>
           <div className="space-y-3">
              {data?.calendar_map?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 font-medium text-sm">
                   <span>{item.date}</span>
                   <span>{item.disruption}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
