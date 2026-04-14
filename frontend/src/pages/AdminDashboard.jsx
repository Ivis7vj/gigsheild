import { useState, useEffect } from 'react';
import api from '../api/client';
import { ShieldAlert, Users, TrendingUp, AlertOctagon, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#1E3A5F', '#FF6B35', '#22C55E', '#FBBF24', '#EF4444'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [claims, setClaims] = useState([]);
  const [triggerLog, setTriggerLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [analytics, w, c] = await Promise.all([
        api.get('/analytics/admin'),
        api.get('/admin/workers'),
        api.get('/admin/claims')
      ]);
      setData(analytics.data);
      setWorkers(w.data);
      setClaims(c.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const runTriggers = async () => {
    const res = await api.post('/triggers/run-all');
    setTriggerLog(res.data.logs.length ? res.data.logs : ["No new triggers fired."]);
    fetchAdminData();
  };

  if (loading) return <div className="text-center p-20">Loading Admin Dashboard...</div>;

  return (
    <div className="bg-[#f8f9fc] min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">GigShield Command Center</h1>
          <button onClick={runTriggers} className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#FF6B35]/90 transition">
             <RefreshCw className="w-4 h-4" /> Run Triggers Now
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
