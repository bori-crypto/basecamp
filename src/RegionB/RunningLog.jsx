import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, 
  Tooltip as RechartsTooltip, Legend 
} from 'recharts';
import { Activity, Zap, MapPin, CheckCircle2 } from 'lucide-react';

export default function RunningLog({ isAdmin, workerUrl, adminPassword }) {
  const [data, setData] = useState({ monthly: [], gear: [], location: [] });
  const [loading, setLoading] = useState(true);
  
  // 수동 입력 폼 상태 (원본 필드 유지)
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
      // 블루프린트 구조에 맞게 데이터 맵핑
      setData({
        monthly: (rawData.monthly || rawData.Monthly_Stats || []).map(d => ({
          ...d,
          dist: parseFloat(d.total_distance) || 0,
          hr: parseInt(d.avg_heart_rate) || 0
        })),
        gear: rawData.gear || rawData.Gear_Status || [],
        location: rawData.location || rawData.Location_Stats || []
      });
    } catch (e) { console.error("데이터 로드 실패:", e); }
    finally { setLoading(false); }
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
            <h3 className="text-xs font-black uppercase tracking-widest">수동 기록 입력</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
            <input type="number" step="0.01" name="distance" placeholder="거리(km)" value={formData.distance} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
            <input type="text" name="time" placeholder="시간(HH:MM:SS)" value={formData.time} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
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
            <input type="number" name="heart_rate" placeholder="심박수" value={formData.heart_rate} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
            <input type="number" name="cadence" placeholder="케이던스" value={formData.cadence} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95">기록 저장하기</button>
        </form>
      )}

      {/* 2. 월별 성장 지표 (상단 차트) */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-6 text-indigo-400 font-black text-xs uppercase tracking-widest">
          <Activity size={16} /> 월별 성장 지표
        </div>
        <div className="h-64 w-full">
          {!loading && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthly}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" hide />
                <YAxis yAxisId="right" hide />
                <RechartsTooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                <Bar yAxisId="left" dataKey="dist" name="거리(km)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="hr" name="평균심박" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3. 장비 상태 (하단 왼쪽) */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-amber-400 font-black text-xs uppercase tracking-widest">
            <Zap size={16} /> 장비 상태
          </div>
          <div className="space-y-3">
            {data.gear.map((g, i) => (
              <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-slate-200">{g.gear}</span>
                <div className="text-right">
                  <div className="text-[10px] font-black text-white">{parseFloat(g.total_km).toFixed(1)} km</div>
                  <div className="text-[8px] text-slate-500 uppercase tracking-tighter">{g.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. 코스 점유율 (하단 오른쪽) */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-emerald-400 font-black text-xs uppercase tracking-widest">
            <MapPin size={16} /> 코스 점유율
          </div>
          <div className="space-y-3">
            {data.location.map((l, i) => (
              <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-slate-200">{l.location}</span>
                <span className="text-[10px] font-black text-indigo-400">{l.total_run} Runs</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
