import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, 
  Tooltip as RechartsTooltip, Legend 
} from 'recharts';
import { Activity, Zap, MapPin } from 'lucide-react';

// --- 헬퍼 함수 ---
const paceToSeconds = (paceStr) => {
  if (!paceStr) return 0;
  const str = String(paceStr);
  const parts = str.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1]; 
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; 
  return 0;
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
      const res = await fetch(`${workerUrl}`, { method: 'GET' });
      const rawData = await res.json();
      
      const processedMonthly = (rawData.Monthly_Stats || rawData.monthly || []).map(d => ({
        month: d.month,
        total_distance: Math.round((parseFloat(d.total_distance) || 0) * 100) / 100,
        avg_heart_rate: parseInt(d.avg_heart_rate) || 0,
        paceSec: paceToSeconds(d.avg_pace)
      }));

      setData({
        monthly: processedMonthly,
        gear: rawData.Gear_Status || rawData.gear || [],
        location: rawData.Location_Stats || rawData.location || []
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
      } else { alert('저장 실패!'); }
    } catch (error) { alert('네트워크 오류!'); }
  };

  return (
    // ✅ 화면 짤림 방지를 위해 pb-10 -> pb-32 로 하단 여백 대폭 확장
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 pb-32 text-white">
      
      {/* 1. 새 러닝 기록 입력 */}
      {isAdmin && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-lg text-left">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">⚡ 새 러닝 기록 입력</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} required 
                className="bg-black/40 border border-white/10 rounded-xl p-3 text-white h-12 outline-none" />
              <input type="number" step="0.1" inputMode="decimal" name="distance" placeholder="거리 (km)" value={formData.distance} onChange={handleInputChange} required 
                className="bg-black/40 border border-white/10 rounded-xl p-3 text-white h-12 outline-none" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input type="text" name="time" placeholder="00:00:00" value={formData.time} onChange={handleInputChange} required 
                className="bg-black/40 border border-white/10 rounded-xl p-3 text-white h-12 outline-none" />
              <input type="number" inputMode="numeric" name="heart_rate" placeholder="심박" value={formData.heart_rate} onChange={handleInputChange}
                className="bg-black/40 border border-white/10 rounded-xl p-3 text-white h-12 outline-none" />
              <input type="number" inputMode="numeric" name="cadence" placeholder="케이던스" value={formData.cadence} onChange={handleInputChange}
                className="bg-black/40 border border-white/10 rounded-xl p-3 text-white h-12 outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select name="location" value={formData.location} onChange={handleInputChange} 
                className="bg-black/40 border border-white/10 rounded-xl p-3 h-12 outline-none appearance-none text-white">
                <option value="">장소 선택</option>
                {data.location.map((l, i) => {
                  const val = l.location || Object.values(l)[0];
                  return <option key={i} value={val}>{val}</option>;
                })}
              </select>
              <select name="gear" value={formData.gear} onChange={handleInputChange} 
                className="bg-black/40 border border-white/10 rounded-xl p-3 h-12 outline-none appearance-none text-white">
                <option value="">장비 선택</option>
                {data.gear.map((g, i) => {
                  const val = g.gear || Object.values(g)[0];
                  return <option key={i} value={val}>{val}</option>;
                })}
              </select>
            </div>

            <input type="text" name="memo" placeholder="메모 (컨디션 등)" value={formData.memo} onChange={handleInputChange}
              className="bg-black/40 border border-white/10 rounded-xl p-3 text-white h-12 outline-none" />

            <button type="submit" className="bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all py-4 rounded-xl font-bold shadow-lg mt-2">
              기록 저장하기
            </button>
          </form>
        </div>
      )}

      {/* 2. 통계 (Monthly Growth) */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-6 text-indigo-400 font-black text-xs uppercase tracking-widest text-left">
          <Activity size={16} className="inline mr-2" /> 통계 (MONTHLY GROWTH)
        </div>
        {/* ✅ 차트 증발 방지를 위해 min-h-[300px] 추가 */}
        <div className="h-[300px] min-h-[300px] w-full">
          {!loading && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" reversed={true} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatPace} domain={['dataMin - 15', 'dataMax + 15']} />
                
                <RechartsTooltip 
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }} 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                  formatter={(value, name) => name === '페이스' ? [formatPace(value), name] : [value, name]}
                />
                
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                
                <Bar yAxisId="left" dataKey="total_distance" name="거리" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="left" type="monotone" dataKey="avg_heart_rate" name="심박" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="paceSec" name="페이스" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. 하단 정보 (Gear & Location) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ✅ [신발 마일리지 그래프화 적용] */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl text-left flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6 text-amber-400 font-black text-xs uppercase tracking-widest">
            <Zap size={16} /> 장비 상태 (GEAR STATUS)
          </div>
          <div className="space-y-6 flex-1">
            {data.gear.map((g, i) => {
              const name = g.gear || Object.values(g)[0];
              const km = parseFloat(g.total_km || Object.values(g)[1] || 0);
              const maxKm = 800; // 수명 800km 기준
              const percent = Math.min((km / maxKm) * 100, 100);
              
              // 게이지 색상 동적 변경 (위험 80%, 주의 50%)
              let barColor = 'bg-indigo-500';
              if (percent > 80) barColor = 'bg-red-500';
              else if (percent > 50) barColor = 'bg-amber-500';

              return (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-sm font-bold text-slate-200">{name}</span>
                    <span className="text-[11px] font-black text-slate-400">
                      <span className="text-amber-400">{km.toFixed(1)}</span> / {maxKm} km
                    </span>
                  </div>
                  {/* 시각화 진행률 바 (Progress Graph) */}
                  <div className="w-full bg-black/50 rounded-full h-2.5 overflow-hidden border border-white/5">
                    <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 장소 점유율 리스트 */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl text-left flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6 text-emerald-400 font-black text-xs uppercase tracking-widest">
            <MapPin size={16} /> 코스 점유율 (LOCATION STATS)
          </div>
          <div className="space-y-3 flex-1">
            {data.location.map((l, i) => {
              const name = l.location || Object.values(l)[0];
              const runs = l.total_run || Object.values(l)[1] || 0;
              return (
                <div key={i} className="flex justify-between items-center bg-white/10 p-4 rounded-2xl border border-white/5">
                  <span className="text-sm font-bold text-slate-200">{name}</span>
                  <span className="text-xs font-black text-emerald-400">{runs} 회</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
