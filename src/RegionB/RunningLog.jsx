import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, 
  Tooltip as RechartsTooltip, Legend 
} from 'recharts';
import { Activity, Zap, MapPin, CheckCircle2 } from 'lucide-react';

export default function RunningLog({ isAdmin, workerUrl, adminPassword }) {
  const [data, setData] = useState({ monthly: [], gear: [], location: [] });
  const [loading, setLoading] = useState(true);

  // 수동 입력 폼 상태
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    distance: '',
    time: '',
    pace: '',
    heart_rate: '',
    cadence: '',
    location: '',
    gear: '',
    memo: ''
  });

  useEffect(() => { if (workerUrl) fetchData(); }, [workerUrl]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${workerUrl}`);
      const rawData = await res.json();
      
      // 블루프린트 구조(Monthly_Stats, Gear_Status, Location_Stats)에 맞게 정밀 매핑
      setData({
        monthly: (rawData.Monthly_Stats || []).map(d => ({
          month: d.month,
          dist: parseFloat(d.total_distance) || 0,
          hr: parseInt(d.avg_heart_rate) || 0
        })),
        gear: rawData.Gear_Status || [],
        location: rawData.Location_Stats || []
      });
    } catch (e) { 
      console.error("데이터 로드 실패:", e); 
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
      const res = await fetch(`${workerUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('기록 성공! 🏃‍♂️');
        fetchData();
        setFormData({ ...formData, distance: '', time: '', heart_rate: '', cadence: '', memo: '' });
      }
    } catch (e) { alert('저장 실패!'); }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 pb-10">
      
      {/* 1. 수동 입력 폼 (관리자 전용) */}
      {isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2 text-indigo-400">
            <CheckCircle2 size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest">Manual Entry</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
            <input type="number" step="0.01" name="distance" placeholder="Distance(km)" value={formData.distance} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
            <input type="text" name="time" placeholder="Time(HH:MM:SS)" value={formData.time} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select name="location" value={formData.location} onChange={handleInputChange} className="bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none">
              <option value="">장소 선택</option>
              {data.location.map((l, i) => <option key={i} value={l.location}>{l.location}</option>)}
            </select>
            <select name="gear" value={formData.gear} onChange={handleInputChange} className="bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none">
              <option value="">신발 선택</option>
              {data.gear.map((g, i) => <option key={i} value={g.gear}>{g.gear}</option>)}
            </select>
            <input type="number" name="heart_rate" placeholder="HR" value={formData.heart_rate} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
            <input type="number" name="cadence" placeholder="Cadence" value={formData.cadence} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all">SAVE LOG</button>
        </form>
      )}

      {/* 2. 월별 성장 지표 (차트) */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-6 text-indigo-400 font-black text-xs uppercase tracking-widest">
          <Activity size={16} /> Monthly Growth
        </div>
        <div className="h-64 w-full">
          {!loading && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthly}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                <Bar dataKey="dist" name="거리(km)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="hr" name="심박" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3. 장비 상태 */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-amber-400 font-black text-xs uppercase tracking-widest">
            <Zap size={16} /> Gear Status
          </div>
          <div className="space-y-3">
            {data.gear.map((g, i) => (
              <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-slate-200">{g.gear}</span>
                <span className="text-[10px] font-black text-indigo-400">{parseFloat(g.total_km || 0).toFixed(1)} km</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. 코스 점유율 */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-emerald-400 font-black text-xs uppercase tracking-widest">
            <MapPin size={16} /> Location Stats
          </div>
          <div className="space-y-3">
            {data.location.map((l, i) => (
              <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-slate-200">{l.location}</span>
                <span className="text-[10px] font-black text-emerald-400">{l.total_run} Runs</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
