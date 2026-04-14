import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  Power, BarChart3, AlertTriangle, CheckCircle, Clock, LogOut,
  User, Activity, MapPin, Wallet, ShieldCheck, Home, Settings,
  Thermometer, Wind, TrendingUp, ChevronRight, Zap, Target,
  Layers, Database, Cpu, Globe, Rocket
} from 'lucide-react';

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [claims, setClaims] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, policyRes, claimsRes, riskRes] = await Promise.all([
          api.get('/workers/profile'),
          api.get('/policy/current'),
          api.get('/claims/my-claims'),
          api.get('/analytics/risk-insights')
        ]);
        setProfile(profileRes.data);
        setPolicy(policyRes.data);
        setClaims(claimsRes.data);
        setRiskData(riskRes.data);
      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const togglePolicy = async () => {
    try {
      const { data } = await api.post('/policy/toggle');
      setPolicy({ ...policy, status: data.status });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('worker_id');
    navigate('/login');
  };

  // --- Render Sections ---

  const renderDashboard = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
      {/* Dynamic Hero Section */}
      <div className="relative group overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF4D00]/20 to-[#00FF94]/20 blur-[100px] opacity-40 group-hover:opacity-70 transition duration-1000"></div>
        <div className="iridescent-border rounded-[48px] p-12 bg-[#0A192F]/80 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-[-20%] right-[-10%] p-10 opacity-10 pointer-events-none group-hover:translate-x-[-50px] transition-transform duration-1000">
            <Rocket className="w-[500px] h-[500px] text-[#FF4D00] rotate-12" />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-end lg:items-center gap-12">
            <div className="space-y-6 flex-1">
              <div className="inline-flex items-center gap-2 bg-[#FF4D00]/10 border border-[#FF4D00]/20 px-5 py-2 rounded-full">
                <div className="w-2 h-2 bg-[#FF4D00] rounded-full animate-pulse shadow-[0_0_10px_#FF4D00]"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF4D00]">Operational Grid: LIVE</span>
              </div>
              <h1 className="text-6xl font-black tracking-tight leading-[0.9] text-white">
                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D00] to-[#00FF94]">{profile?.full_name?.split(' ')[0]}</span>.
              </h1>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md hover:bg-white/10 transition-colors cursor-pointer group/data">
                  <User size={18} className="text-[#FF4D00] group-hover/data:rotate-12 transition-transform" />
                  <div>
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Worker Node</p>
                    <p className="text-sm font-black text-blue-100 uppercase mt-0.5">{profile?.worker_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md hover:bg-white/10 transition-colors cursor-pointer group/data">
                  <MapPin size={18} className="text-[#00FF94] group-hover/data:translate-y-[-2px] transition-transform" />
                  <div>
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Geo-Zone</p>
                    <p className="text-sm font-black text-blue-100 uppercase mt-0.5">{profile?.city}, {profile?.zone}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Week Pro-Status</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <div key={i} className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${i < 6 ? 'bg-[#00FF94]/10 border-[#00FF94]/30 text-[#00FF94]' : 'bg-white/5 border-white/10 text-gray-600'}`}>
                    <Target size={16} />
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-bold text-[#00FF94] tracking-widest">LOYALTY MULTIPLIER: 1.2x Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* High-Contrast Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Dynamic Risk Gauge */}
        <div className="glass-card rounded-[40px] p-8 flex flex-col gap-6 relative overflow-hidden group border-t-2 border-t-[#00FF94]/20">
          <div className="flex justify-between items-center relative z-10">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity size={14} className="text-[#00FF94]" /> Risk Density
            </h3>
            <span className="text-[9px] font-black bg-[#00FF94]/10 text-[#00FF94] px-2.5 py-1 rounded-full border border-[#00FF94]/20 animate-glow">STABLE</span>
          </div>
          <div className="flex items-center gap-10 py-4">
            <div className="relative">
              <svg className="w-32 h-32 -rotate-90">
                <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                <circle
                  cx="64" cy="64" r="58" fill="none"
                  stroke="#00FF94" strokeWidth="12"
                  strokeDasharray="364" strokeDashoffset={364 - (364 * (riskData?.risk_pulse?.city_score || 24)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">{riskData?.risk_pulse?.city_score || 24}%</span>
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Active</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {riskData?.risk_pulse?.zones.slice(0, 2).map((z, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase">
                    <span>{z.name.split(' ')[1]}</span>
                    <span className="text-white">{z.score}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full">
                    <div className={`h-full rounded-full ${i === 0 ? 'bg-[#00FF94]' : 'bg-[#FF4D00]'}`} style={{ width: `${z.score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Protection Score Card */}
        <div className="glass-card rounded-[40px] p-8 flex flex-col gap-6 group border-t-2 border-t-[#FF4D00]/20">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#FF4D00]" /> Protection Value
            </h3>
            <Target size={18} className="text-[#FF4D00]/40 group-hover:rotate-45 transition-transform" />
          </div>
          <div className="flex-1 flex flex-col justify-end gap-6 pt-4">
            <div className="space-y-2">
              <p className="text-5xl font-black text-white tracking-tighter transition-all group-hover:scale-105 origin-left">{riskData?.safety_score?.current}</p>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Safety Momentum Credits</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div className="bg-gradient-to-r from-[#FF4D00] to-[#FF8A00] h-full rounded-full shadow-[0_0_15px_rgba(255,77,0,0.5)] transition-all duration-1000" style={{ width: '78%' }}></div>
              </div>
              <span className="text-[10px] font-black text-[#FF4D00]">GOLD</span>
            </div>
          </div>
        </div>

        {/* Trigger Forecast Card */}
        <div className="glass-card rounded-[40px] p-8 flex flex-col gap-6 group border-t-2 border-t-blue-500/20">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-500" /> Forecast Hub
          </h3>
          <div className="flex-1 flex items-end gap-2.5 pb-2">
            {riskData?.projections?.map((p, i) => (
              <div key={i} className="flex-1 flex flex-col gap-2 items-center group/bar">
                <div className="w-full bg-white/5 rounded-xl flex items-end relative h-28 border border-white/5 overflow-hidden">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-1000 delay-${i * 100} group-hover/bar:brightness-125 ${p.risk > 60 ? 'bg-[#FF4D00]' : 'bg-[#00FF94]'}`}
                    style={{ height: `${p.risk}%` }}
                  ></div>
                </div>
                <span className="text-[8px] font-black text-gray-600 uppercase">{p.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Feature Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Policy Control Panel */}
        <div className="glass-card rounded-[48px] p-12 space-y-10 relative overflow-hidden group">
          <div className="absolute bottom-[-10%] left-[-10%] opacity-5 pointer-events-none group-hover:scale-150 transition-transform duration-[2s]">
            <Activity className="w-80 h-80 text-[#00FF94]" />
          </div>
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-white tracking-tighter">System Coverage</h2>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-dashed transition-all duration-500 ${policy?.status === 'Active' ? 'bg-[#00FF94]/10 text-[#00FF94] border-[#00FF94]/30' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                {policy?.status === 'Active' ? 'ENCRYPTED PROTECTION ACTIVE' : 'PROTECTION OFF - VULNERABLE'}
              </div>
            </div>
            <button
              onClick={togglePolicy}
              className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 transform active:scale-90 hover:rotate-12 ${policy?.status === 'Active' ? 'bg-[#FF4D00] text-white shadow-[#FF4D00]/40 shadow-2xl' : 'bg-white/5 text-gray-500 border border-white/10'}`}
            >
              <Power size={32} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 relative z-10">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-1 hover:bg-white/8 transition-colors">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Base Premium</p>
              <p className="text-3xl font-black text-white leading-none">₹{policy?.premium || '128'}<span className="text-xs font-bold text-gray-600">/wk</span></p>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-1 hover:bg-white/8 transition-colors text-right">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Payout Ceiling</p>
              <p className="text-3xl font-black text-[#00FF94] leading-none">₹{policy?.payout_cap || '15k'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Integrated Exclusions</h4>
            <div className="flex flex-wrap gap-2.5">
              {["Warfare", "Viral Pandemics", "Nuclear Hazards", "Cyber Terrorism"].map((ex, i) => (
                <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black text-gray-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all cursor-help flex items-center gap-2 group/ex">
                  <AlertTriangle size={12} className="group-hover/ex:text-red-500" /> {ex}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Timeline Card */}
        <div className="glass-card rounded-[48px] p-12 space-y-10">
          <div className="flex justify-between items-center">
            <h3 className="text-3xl font-black text-white tracking-tighter">Event Logs</h3>
            <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[#FF4D00] hover:bg-[#FF4D00] hover:text-white transition-all transform active:scale-95 group">
              <Activity size={20} className="group-hover:animate-pulse" />
            </button>
          </div>

          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {claims.length === 0 ? (
              <div className="h-64 border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center text-center p-8">
                <div className="p-6 bg-white/5 rounded-full mb-6 animate-float">
                  <ShieldCheck size={40} className="text-gray-700" />
                </div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Operational Integrity Maintained</p>
                <p className="text-[10px] text-gray-600 font-medium max-w-[200px] mt-2">The system has detected zero adverse parametric triggers in your geo-zone.</p>
              </div>
            ) : (
              claims.map((claim, idx) => (
                <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-[32px] flex items-center justify-between group/item hover:bg-white/8 transition-all duration-300 transform hover:scale-[0.98]">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover/item:rotate-12 ${claim.status === 'Paid' ? 'bg-[#00FF94]/10 text-[#00FF94]' : 'bg-blue-500/10 text-blue-400'}`}>
                      {claim.status === 'Paid' ? <CheckCircle size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white group-hover/item:text-[#FF4D00] transition-colors">{claim.event_name}</h4>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{new Date(claim.triggered_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white leading-none">₹{claim.payout_amount}</p>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mt-2 inline-block ${claim.status === 'Paid' ? 'bg-[#00FF94]/20 text-[#00FF94]' : 'bg-white/5 text-gray-500'}`}>{claim.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-12 animate-in slide-in-from-right-12 duration-1000 ease-out">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Big Trend Chart Column */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          <div className="glass-card rounded-[48px] p-12 relative overflow-hidden">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter">Velocity Projections</h2>
                <p className="text-sm font-bold text-gray-500 mt-2">Real-time risk/reward probability mapping for Mumbai Geo-Grid.</p>
              </div>
              <div className="flex gap-4">
                <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-blue-400">7D VOLATILITY: LOW</div>
                <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-[#00FF94]">EARNING PULSE: OPTIMAL</div>
              </div>
            </div>

            {/* SVG Line Chart for Trends */}
            <div className="h-80 w-full relative pt-10">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00FF94" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0A192F" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 150 Q 150 100 300 130 T 600 70 T 1000 90 L 1000 200 L 0 200 Z"
                  fill="url(#chartGradient)"
                  className="animate-in fade-in duration-[2s]"
                />
                <path
                  d="M0 150 Q 150 100 300 130 T 600 70 T 1000 90"
                  fill="none"
                  stroke="#00FF94"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="animate-in slide-in-from-left-[500px] duration-[1.5s]"
                />
                {/* Dots on peak */}
                <circle cx="600" cy="70" r="6" fill="#00FF94" className="animate-glow" />
              </svg>
              <div className="absolute top-0 right-0 p-4 bg-[#0A192F]/50 backdrop-blur-md rounded-2xl border border-[#00FF94]/30">
                <p className="text-[10px] font-black text-[#00FF94] uppercase transition-colors">Potential Payout Event: 82% Likely</p>
                <p className="text-xs font-black text-white mt-1">Expected Peak: Wednesday, 6:30 PM</p>
              </div>
            </div>

            <div className="flex justify-between mt-8 pt-8 border-t border-white/5 text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">
              <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
            </div>
          </div>

          {/* Risk Concentration Grid */}
          <div className="glass-card rounded-[48px] p-12">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
              <Globe size={16} className="text-blue-500" /> Geo-Density Analysis
            </h3>
            <div className="grid grid-cols-12 gap-2 h-40">
              {Array.from({ length: 12 * 5 }).map((_, i) => {
                const intensity = Math.random();
                return (
                  <div key={i} className="hover:scale-125 transition-transform cursor-crosshair relative group/sq">
                    <div className="absolute inset-0 rounded-[4px] border border-white/5" />
                    <div
                      className="w-full h-full rounded-[4px]"
                      style={{
                        background: intensity > 0.8 ? '#FF4D00' : intensity > 0.4 ? '#00FF94' : '#1E3A5F',
                        opacity: intensity * 0.9 + 0.1
                      }}
                    />
                    <div className="hidden group-hover/sq:block absolute bottom-full left-1/2 -translate-x-1/2 bg-white text-[#0A192F] p-2 rounded-lg text-[8px] font-black z-50 whitespace-nowrap mb-2">
                      ZONE {i}: {(intensity * 100).toFixed(0)}% DENSITY
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-8 mt-8 justify-center">
              <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase">
                <div className="w-3 h-3 bg-[#1E3A5F] rounded-sm"></div> LOW RISK
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase">
                <div className="w-3 h-3 bg-[#00FF94] rounded-sm"></div> OPTIMAL
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase">
                <div className="w-3 h-3 bg-[#FF4D00] rounded-sm"></div> ADVERSE TRIGGER
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="lg:col-span-4 flex flex-col gap-10">
          <div className="iridescent-border rounded-[40px] p-10 bg-[#0A192F]/80 backdrop-blur-xl space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-500/10 rounded-2xl">
                <Target size={24} className="text-[#FF4D00]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Insights Protocol</p>
                <h4 className="text-xl font-black text-white">Zone Alpha-4</h4>
              </div>
            </div>
            <div className="space-y-6">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-[#00FF94]/30 transition-all">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Correlation Index</p>
                <p className="text-2xl font-black text-white">0.86 <span className="text-xs text-[#00FF94]">Strong</span></p>
                <p className="text-[10px] text-gray-400 font-medium mt-2 leading-relaxed">High correlation between local rain intensity and your payout triggers.</p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-[#FF4D00]/30 transition-all">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Optimal Zone</p>
                <p className="text-2xl font-black text-white">Mumbai SW-2</p>
                <p className="text-[10px] text-gray-400 font-medium mt-2 leading-relaxed">Consider shifting shifts to Southwest-2 for higher stability coverage.</p>
              </div>
            </div>
            <button className="w-full py-5 bg-[#FF4D00] text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-[#FF4D00]/30 hover:scale-[1.02] transition active:scale-95">Download Full Data Matrix</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSafety = () => (
    <div className="space-y-12 animate-in zoom-in-95 duration-700">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Pro-Shield Hub</h2>
          <p className="text-gray-500 font-bold mt-2 uppercase tracking-widest text-[10px]">Verification & Operational Integrity Protocols</p>
        </div>
        <div className="bg-[#00FF94]/10 border border-[#00FF94]/20 px-6 py-3 rounded-2xl flex items-center gap-3">
          <ShieldCheck size={20} className="text-[#00FF94]" />
          <span className="text-xs font-black text-[#00FF94] uppercase tracking-widest leading-none">Identity Verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-card rounded-[40px] p-10 flex flex-col items-center text-center group">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[#00FF94] rounded-full blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="w-40 h-40 rounded-full border-[8px] border-white/5 p-2 transition-transform group-hover:rotate-12">
                <div className="w-full h-full bg-[#0A192F] rounded-full flex items-center justify-center text-5xl border border-white/10 group-hover:border-[#00FF94]/50 transition-colors">
                  {profile?.full_name?.charAt(0)}
                </div>
              </div>
              <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#00FF94] rounded-2xl border-4 border-[#0A192F] flex items-center justify-center shadow-lg">
                <CheckCircle size={20} className="text-[#0A192F]" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white">{profile?.full_name}</h3>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mt-1">Platform ID: {profile?.worker_id}</p>
            <div className="mt-8 flex gap-3">
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-blue-400"><Database size={20} /></div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[#FF4D00]"><Cpu size={20} /></div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[#00FF94]"><Globe size={20} /></div>
            </div>
          </div>

          <div className="glass-card rounded-[40px] p-8 space-y-6">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Trust Metrics</h4>
            <div className="space-y-4">
              {[
                { label: 'Behavior Score', value: 98, color: '#00FF94' },
                { label: 'On-time Link-up', value: 92, color: '#00FF94' },
                { label: 'Trigger Honesty', value: 100, color: '#00FF94' }
              ].map((m, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span className="text-gray-400">{m.label}</span>
                    <span className="text-white">{m.value}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${m.value}%`, background: m.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card rounded-[48px] p-12 space-y-10">
          <h3 className="text-2xl font-black text-white tracking-tighter">Safety Verification Checklist</h3>
          <div className="space-y-6">
            {[
              { title: 'Biometric Authenticated', status: 'COMPLETED', date: 'Daily Protocol', icon: User },
              { title: 'Zone Adherence Log', status: 'IN-PROGRESS', date: 'Live Session', icon: MapPin },
              { title: 'Hardware Integrity Check', status: 'COMPLETED', date: '24h Cycle', icon: Cpu },
              { title: 'Actuarial Profile Updated', status: 'COMPLETED', date: 'Monthly Data', icon: Layers },
              { title: 'Parametric Node Synced', status: 'STABLE', date: 'Live Connection', icon: Activity }
            ].map((item, i) => (
              <div key={i} className={`p-8 rounded-[32px] border flex items-center justify-between group/item transition-all ${item.status === 'COMPLETED' ? 'bg-[#00FF94]/5 border-[#00FF94]/20' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                <div className="flex items-center gap-8">
                  <div className={`p-5 rounded-2xl group-hover/item:scale-110 transition-transform ${item.status === 'COMPLETED' ? 'bg-[#00FF94]/20 text-[#00FF94]' : 'bg-gray-500/10 text-gray-500'}`}>
                    <item.icon size={28} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white">{item.title}</h4>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black px-4 py-2 rounded-xl border ${item.status === 'COMPLETED' ? 'bg-[#00FF94] text-[#0A192F] border-transparent' : 'bg-white/5 text-gray-500 border-white/10'}`}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-12 animate-in slide-in-from-left-12 duration-1000 ease-out">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Earnings Pipeline</h2>
          <p className="text-gray-500 font-bold mt-2 uppercase tracking-widest text-[10px]">Financial Flow & Parameter Payout Matrix</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-card px-8 py-4 rounded-[28px] border-t-2 border-t-[#00FF94]/30">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Protection Payouts</p>
            <p className="text-2xl font-black text-white leading-none">₹{claims.reduce((acc, c) => acc + (c.status === 'Paid' ? c.payout_amount : 0), 0).toFixed(0)}</p>
          </div>
          <div className="glass-card px-8 py-4 rounded-[28px] border-t-2 border-t-[#FF4D00]/30">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Potential Claims</p>
            <p className="text-2xl font-black text-white leading-none">₹0</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-10">
          <div className="glass-card rounded-[48px] p-12">
            <h3 className="text-2xl font-black text-white tracking-tighter mb-10">Transaction Stream</h3>
            <div className="space-y-6">
              {claims.filter(c => c.status === 'Paid').length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center opacity-30">
                  <Wallet size={64} className="mb-4" />
                  <p className="font-black uppercase tracking-widest text-xs">No Payout Actions Found</p>
                </div>
              ) : (
                claims.filter(c => c.status === 'Paid').map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-8 bg-white/5 border border-white/10 rounded-[40px] hover:bg-white/8 transition-all group">
                    <div className="flex items-center gap-8">
                      <div className="p-6 bg-[#00FF94]/10 rounded-3xl text-[#00FF94]">
                        <Zap size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Parametric Offset</p>
                        <h4 className="text-2xl font-black text-white">{c.event_name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(c.triggered_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-black text-[#00FF94] tracking-tighter">+ ₹{c.payout_amount}</p>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-2 block">VERIFIED & TRANSFERRED</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-10">
          <div className="iridescent-border rounded-[40px] p-10 bg-[#0A192F]/80 backdrop-blur-xl relative group overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] opacity-5 text-[#00FF94]">
              <Wallet size={120} className="rotate-12" />
            </div>
            <h4 className="text-lg font-black text-white mb-8 tracking-tight">Withdrawal Matrix</h4>
            <div className="space-y-6 mb-10">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Linked UPI Node</p>
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 uppercase font-black text-xs text-blue-200">
                  <div className="w-2 h-2 bg-[#00FF94] rounded-full"></div> ramesh@okaxis
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-white/5">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Current Liquid Funds</p>
                <p className="text-4xl font-black text-white">₹{claims.reduce((acc, c) => acc + (c.status === 'Paid' ? c.payout_amount : 0), 0).toFixed(0)}</p>
              </div>
            </div>
            <button className="w-full py-5 bg-[#00FF94] text-[#0A192F] rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-[#00FF94]/30 hover:scale-[1.05] transition active:scale-95 group">
              <div className="flex items-center justify-center gap-2"> Execute Instant Payout <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></div>
            </button>
          </div>

          <div className="glass-card rounded-[40px] p-10">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Tax Protocol</p>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-gray-400">Total Deducted</span>
                <span className="text-white">₹0.00</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-gray-400">TDS (1%)</span>
                <span className="text-white">WAITING</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050B14]">
      <div className="relative">
        <div className="w-24 h-24 rounded-[32px] border-4 border-[#FF4D00]/10 border-t-[#FF4D00] animate-spin shadow-[0_0_50px_rgba(255,77,0,0.2)]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <ShieldCheck size={32} className="text-[#00FF94] animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#050B14] min-h-screen flex font-sans overflow-hidden text-blue-100 selection:bg-[#FF4D00] selection:text-white">
      {/* Sidebar - Pro Glassmorphism */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-24'} glass-nav text-white flex-shrink-0 transition-all duration-700 ease-[cubic-bezier(0.85,0,0.15,1)] flex flex-col shadow-[20px_0_60px_-15px_rgba(0,0,0,0.5)] relative z-[100]`}>
        <div className="p-10 flex items-center justify-between">
          <div className={`flex items-center gap-4 ${!sidebarOpen && 'hidden'}`}>
            <div className="p-3 bg-[#FF4D00] rounded-2xl shadow-[0_0_30px_#FF4D0055] group hover:scale-110 transition-transform">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <span className="text-3xl font-black tracking-tighter uppercase italic">GigShield</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 active:scale-90 group">
            <Activity size={24} className={sidebarOpen ? "text-[#FF4D00] drop-shadow-[0_0_8px_#FF4D00]" : "text-white group-hover:text-[#FF4D00] transition-colors"} />
          </button>
        </div>

        <nav className="flex-1 mt-12 px-6 space-y-4">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Home, desc: 'Operational Grid' },
            { id: 'analytics', label: 'Analytics', icon: BarChart3, desc: 'Velocity Projections' },
            { id: 'claims', label: 'Claims', icon: Activity, desc: 'Parametric Logs' },
            { id: 'safety', label: 'Safety Hub', icon: ShieldCheck, desc: 'Trust Protocols' },
            { id: 'payouts', label: 'Earnings', icon: Wallet, desc: 'Financial Flow' },
            { id: 'settings', label: 'Account', icon: Settings, desc: 'Node Config' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-6 px-6 py-5 rounded-3xl transition-all duration-500 group relative overflow-hidden ${activeTab === item.id ? 'bg-[#FF4D00]/10 text-white border border-[#FF4D00]/30 shadow-[inset_0_0_20px_rgba(255,77,0,0.1)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={24} className={`transition-all duration-500 group-hover:scale-125 ${activeTab === item.id ? 'text-[#FF4D00] drop-shadow-[0_0_15px_#FF4D00CC]' : 'group-hover:text-[#FF4D00]'}`} />
              <div className={`text-left ${!sidebarOpen && 'hidden'}`}>
                <p className="font-black text-sm tracking-tight leading-none mb-1">{item.label}</p>
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{item.desc}</p>
              </div>
              {activeTab === item.id && <div className="absolute right-[-4px] w-2 h-10 bg-[#FF4D00] rounded-full shadow-[0_0_20px_#FF4D00]"></div>}
            </button>
          ))}
        </nav>

        <div className="p-8 mb-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-6 px-6 py-5 rounded-3xl text-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20 group">
            <LogOut size={24} className="group-hover:-translate-x-1 transition-transform" />
            <span className={`font-black text-sm uppercase tracking-[0.2em] ${!sidebarOpen && 'hidden'}`}>Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_50%_0%,_#0F1F3D_0%,_#050B14_100%)]">
        {/* Dynamic Background Blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#FF4D00]/5 rounded-full blur-[150px] animate-float pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#00FF94]/5 rounded-full blur-[150px] animate-float pointer-events-none" style={{ animationDelay: '-2s' }}></div>

        <header className="bg-transparent sticky top-0 z-50 px-12 py-10 flex justify-between items-center h-40">
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 lg:hidden text-[#FF4D00]`} onClick={() => setSidebarOpen(true)}>
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-white text-5xl font-black capitalize tracking-tighter leading-none">{activeTab}</h2>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-2 h-2 bg-[#00FF94] rounded-full shadow-[0_0_10px_#00FF94]"></div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em]">Sub-Node Synchronized</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-12">
            <div className="hidden xl:flex items-center gap-6">
              <div className="glass-card px-8 py-4 rounded-3xl flex items-center gap-5 border-t-2 border-t-blue-500/20">
                <Thermometer size={18} className="text-blue-400" />
                <div className="text-left font-black tracking-tighter leading-none">
                  <p className="text-lg text-white">28°C</p>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">Local Mumbai</p>
                </div>
              </div>
              <div className="glass-card px-8 py-4 rounded-3xl flex items-center gap-5 border-t-2 border-t-[#00FF94]/20">
                <Wind size={18} className="text-[#00FF94]" />
                <div className="text-left font-black tracking-tighter leading-none">
                  <p className="text-lg text-white">OPTIMAL</p>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">Air Integrity</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 pl-12 border-l border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-lg font-black text-white leading-none mb-1 tracking-tight">{profile?.full_name}</p>
                <p className="text-[10px] font-black text-[#FF4D00] uppercase tracking-[0.3em]">{profile?.worker_id}</p>
              </div>
              <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#FF4D00] to-[#FF8A00] p-1 shadow-[0_0_30px_rgba(255,77,0,0.3)] hover:scale-105 transition-transform cursor-pointer group active:scale-95">
                <div className="w-full h-full bg-[#0A192F] rounded-[22px] flex items-center justify-center text-white text-xl font-black group-hover:bg-[#FF4D00] transition-colors">
                  {profile?.full_name?.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1600px] mx-auto px-12 pb-24 w-full relative z-10">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'claims' && renderDashboard() /* Reuse dashboard logic as placeholder or re-render dashboard summary */}
          {activeTab === 'safety' && renderSafety()}
          {activeTab === 'payouts' && renderEarnings()}
          {activeTab === 'settings' && (
            <div className="flex flex-col items-center justify-center py-40 glass-card rounded-[64px] border-white/10 animate-in zoom-in duration-1000">
              <div className="p-12 bg-white/5 rounded-full mb-10 border border-white/10">
                <Settings size={64} className="text-[#FF4D00] animate-spin-slow opacity-50" />
              </div>
              <h2 className="text-4xl font-black text-white capitalize tracking-tighter">{activeTab} Node Access</h2>
              <p className="text-gray-500 font-bold text-lg mt-4 uppercase tracking-[0.2em]">Encrypted Configuration Cycle Active...</p>
              <div className="mt-12 w-64 bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#FF4D00] h-full rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: '30%' }}></div>
              </div>
            </div>
          )}

          {/* Custom view for Tab 3 which was missing content in user screenshot */}
          {activeTab === 'claims' && (
            <div className="space-y-12 animate-in fade-in duration-1000">
              <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-white tracking-tighter">Full Parametric Archive</h2>
                <button className="bg-white/5 border border-white/10 hover:bg-[#FF4D00] hover:text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all">Export JSON Matrix</button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {claims.length === 0 ? (
                  <div className="py-40 glass-card rounded-[48px] flex flex-col items-center text-center">
                    <Activity size={64} className="text-gray-700 mb-6" />
                    <p className="text-xl font-black text-gray-500 uppercase tracking-widest">Archive Empty</p>
                    <p className="text-sm text-gray-600 mt-2 font-medium">No historical triggers detected in your current geo-registry.</p>
                  </div>
                ) : (
                  claims.map((c, i) => (
                    <div key={i} className="glass-card rounded-[40px] p-10 flex items-center justify-between border-l-4 border-l-[#00FF94]/50 group">
                      <div className="flex items-center gap-12">
                        <div className="p-8 bg-white/5 rounded-[32px] text-blue-400 group-hover:text-[#FF4D00] transition-colors">
                          <Layers size={40} />
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Event Token: {c.claim_id?.slice(-8)}</p>
                          <h3 className="text-3xl font-black text-white">{c.event_name}</h3>
                          <div className="flex gap-6 mt-4">
                            <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                              <Calendar size={14} /> {new Date(c.triggered_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                              <Activity size={14} /> {c.trigger_type}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right pl-12 border-l border-white/5">
                        <p className="text-5xl font-black text-white tracking-tighter">₹{c.payout_amount}</p>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase mt-4 inline-block ${c.status === 'Paid' ? 'bg-[#00FF94]/20 text-[#00FF94]' : 'bg-white/5 text-gray-500'}`}>{c.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
// Helper icons
function Calendar({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg> }
