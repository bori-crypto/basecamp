import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  PieChart, Pie, Cell, BarChart
} from 'recharts';
import { Activity, Footprints, MapPin, Gauge, Heart, Timer, Calendar, PlusCircle } from 'lucide-react';

// --- 헬퍼 함수 ---
const paceToSeconds = (paceStr) => {
  if (!paceStr) return 0;
  const parts = paceStr.split(':');
  if (parts.length !== 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

const formatPace = (seconds) => {
  if (!seconds) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
};

// --- 커스텀 툴팁 컴포넌트 ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-3 rounded-xl text-white text-xs shadow-2xl">
        <p className="font-black mb-2 border-b border-white/10 pb-1 text-indigo-300 uppercase tracking-tighter">{label} Report</p>
        {payload.map((entry, index) => {
          const value = entry.dataKey === 'paceSec' ? formatPace(entry.value) : entry.value;
          // ✅ 시트 원본 이름표에 맞춰 단위 설정
          const unit = entry.dataKey === 'total_distance' ? 'km' : 
                       entry.dataKey === 'avg_heart_rate' ? 'bpm' : 
                       entry.dataKey === 'total_km' ? 'km' : 
                       entry.dataKey === 'total_run' ? 'Times' : '';
          return (
            <div key={index} className="flex items-center gap-2 my-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-slate-400 font-medium">{entry.name}:</span>
              <span className="font-bold text-slate-100">{value} {unit}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function App({ isAdmin = true, workerUrl = "", adminPassword = "" }) {
  const [data, setData] = useState({ monthly: [], gear: [], location: [] });
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    distance: '', time: '', pace: '', heart_rate: '', cadence: '', location: '', gear: '', memo: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!workerUrl) throw new Error('Worker URL Not Set');
      const res = await fetch(`${workerUrl}/run-log`, { method: 'GET' });
      if (!res.ok) throw new Error('Fetch Failed');
      
      const rawData = await res.json();
      
      // ✅ 번역기 제거: paceSec(계산용 초 데이터)만 추가하고 원본 그대로 사용
      const processedMonthly = (rawData.monthly || rawData.Monthly_Stats || []).map(item => ({
        ...item,
        paceSec: paceToSeconds(item.avg_pace)
      }));

      setData({ 
        monthly: processedMonthly,
        gear: rawData.gear || rawData.Gear_Status || [],
        location: rawData.location || rawData.Location_Stats || []
      });
    } catch (error) {
      console.warn("Fetch Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const res = await fetch(`${workerUrl}/run-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': adminPassword
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        fetchData();
        setFormData({ ...formData, distance: '', time: '', pace: '', heart_rate: '', cadence: '', memo: '' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
      
      {/* [A] Admin Form */}
      {isAdmin && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-indigo-400">
            <PlusCircle size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest">New Session</h2>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Distance (km)</label>
              <input type="number" step="0.1" name="distance" placeholder="0.0" value={formData.distance} onChange={handleInputChange} required className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Pace (mm:ss)</label>
              <input type="text" name="pace" placeholder="00:00" value={formData.pace} onChange={handleInputChange} required className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Heart Rate</label>
              <input type="number" name="heart_rate" placeholder="bpm" value={formData.heart_rate} onChange={handleInputChange} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all" />
            </div>
            
            <div className="col-span-2 md:col-span-4 flex gap-3 mt-2">
              <input type="text" name="memo" placeholder="Add session notes..." value={formData.memo} onChange={handleInputChange} className="flex-1 bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all" />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                Log
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white/5 rounded-[2rem] border border-white/5">
          <div className="flex flex-col items-center gap-3">
            <Activity className="text-indigo-500 animate-pulse" size={32} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Syncing Bio-Data...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* [B] Growth Report */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 text-emerald-400">
                <Gauge size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">Growth Analytics</h3>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis yAxisId="left" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" reversed={true} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatPace} domain={['dataMin - 15', 'dataMax + 15']} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '20px' }} />
                  
                  {/* ✅ UI 차트 이름표를 원본 시트 이름표로 직결 */}
                  <Bar yAxisId="left" dataKey="total_distance" name="Dist" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                  <Line yAxisId="left" type="monotone" dataKey="avg_heart_rate" name="HR" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} />
                  <Line yAxisId="right" type="monotone" dataKey="paceSec" name="Pace" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} shadow="0 0 10px rgba(16,185,129,0.5)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column: Gear & Course */}
          <div className="flex flex-col gap-6">
            
            {/* [C] Gear Mileage */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl flex-1">
              <div className="flex items-center gap-2 text-amber-400 mb-6">
                <Footprints size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">Gear Life</h3>
              </div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {/* ✅ UI 파이 차트 이름표를 원본 시트 이름표(total_km, gear)로 직결 */}
                  <PieChart>
                    <Pie data={data.gear} dataKey="total_km" nameKey="gear" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={8} stroke="none">
                      {data.gear.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none" />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {/* ✅ 리스트 출력 이름표 직결 */}
                {data.gear.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] px-2">
                    <span className="text-slate-400 font-bold uppercase">{item.gear}</span>
                    <span className="text-slate-100 font-black tracking-tighter">{item.total_km} KM</span>
                  </div>
                ))}
              </div>
            </div>

            {/* [D] Course Analytics */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl">
              <div className="flex items-center gap-2 text-purple-400 mb-6">
                <MapPin size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">Sector Dominance</h3>
              </div>
              <div className="space-y-4">
                {/* ✅ 장소 목록 이름표(location, total_run) 직결 */}
                {data.location.map((item, idx) => {
                  const maxDist = Math.max(...data.location.map(l => l.total_run));
                  const percentage = (item.total_run / maxDist) * 100;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black px-1 uppercase tracking-tighter">
                        <span className="text-slate-300">{item.location}</span>
                        <span className="text-indigo-400">{item.total_run} Times</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
