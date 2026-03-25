import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, 
  Tooltip as RechartsTooltip, Legend 
} from 'recharts';
import { Activity, Zap, MapPin, CheckCircle2 } from 'lucide-react';

// --- 페이스 변환 헬퍼 ---
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

export default function RunningLog({ isAdmin, workerUrl, adminPassword }) {
  const [data, setData] = useState({ monthly: [], gear: [], location: [] });
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    distance: '', time: '', heart_rate: '', cadence: '', location: '', gear: '', memo: ''
  });

  useEffect(() => { if (workerUrl) fetchData(); }, [workerUrl]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${workerUrl}`);
      const rawData = await res.json();
      
      // ✅ 월별 통계 처리 (소수점 2자리 고정 및 페이스 변환)
      const processedMonthly = (rawData.Monthly_Stats || []).map(d => ({
        month: d.month,
        total_distance: Math.round((parseFloat(d.total_distance) || 0) * 100) / 100,
        avg_heart_rate: parseInt(d.avg_heart_rate) || 0,
        paceSec: paceToSeconds(d.avg_pace)
      }));

      setData({
        monthly: processedMonthly,
        gear: rawData.Gear_Status || [],
        location: rawData.Location_Stats || []
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
      
      {/* 1. 수동 기록 입력 (한글화 및 레이아웃 복구) */}
      {isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2 text-indigo-400">
            <CheckCircle2 size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest">수동 기록 입력</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
            <input type="number" step="0.01" name="distance" placeholder="거리 (km)" value={formData.distance} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
            <input type="text" name="time" placeholder="시간 (HH:MM:SS)" value={formData.time} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
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
          <input type="text" name="memo" placeholder="메모 (컨디션, 코스 상세 등)" value={formData.memo} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none mt-2" />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all">기록 저장하기</button>
        </form>
      )}

      {/* 2. 월별 성장 지표 (차트 범례 및 Y축 복구) */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-6 text-indigo-400 font-black text-xs uppercase tracking-widest">
          <Activity size={16} /> 통계 (Monthly Growth)
        </div>
        <div className="h-64 w-full">
          {!loading && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                {/* 왼쪽 Y축: 거리 (숫자 표시) */}
                <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                {/* 오른쪽 Y축: 페이스 (거꾸로 뒤집기) */}
                <YAxis yAxisId="right" orientation="right" reversed={true} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatPace} domain={['dataMin - 15', 'dataMax + 15']} />
                
                <RechartsTooltip 
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }} 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                  formatter={(value, name) => name === '페이스' ? [formatPace(value), name] : [value, name]}
                />
                
                {/* 범례(Legend) 복구 */}
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                
                <Bar yAxisId="left" dataKey="total_distance" name="거리" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="left" type="monotone" dataKey="avg_heart_rate" name="심박" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="paceSec" name="페이스" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. 하단 리스트 레이아웃 복구 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-amber-400 font-black text-xs uppercase tracking-widest">
            <Zap size={16} /> 장비 상태 (Gear Status)
          </div>
          <div className="space-y-3">
            {data.gear.map((g, i) => (
              <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-slate-200">{g.gear}</span>
                <span className="text-[10px] font-black text-indigo-400">{parseFloat(g.total_km || 0).toFixed(2)} km</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-emerald-400 font-black text-xs uppercase tracking-widest">
            <MapPin size={16} /> 코스 점유율 (Location Stats)
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
