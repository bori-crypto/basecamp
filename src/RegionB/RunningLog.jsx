import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, 
  Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { Activity, Zap, MapPin, CheckCircle2 } from 'lucide-react';

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

// --- 커스텀 툴팁 (소수점 2자리 고정 적용) ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
        <p className="text-[10px] font-bold text-slate-400 mb-2 border-b border-white/5 pb-1">{label}</p>
        {payload.map((entry, index) => {
          // 거리 데이터일 경우 소수점 2자리 고정, 페이스는 시간 포맷 변환
          let displayValue = entry.value;
          if (entry.dataKey === 'total_distance' || entry.dataKey === 'total_km') {
            displayValue = Number(entry.value).toFixed(2);
          } else if (entry.dataKey === 'paceSec') {
            displayValue = formatPace(entry.value);
          }

          const unit = entry.dataKey === 'total_distance' ? 'km' : 
                       entry.dataKey === 'avg_heart_rate' ? 'bpm' : 
                       entry.dataKey === 'total_km' ? 'km' : 
                       entry.dataKey === 'total_run' ? '회' : '';

          return (
            <div key={index} className="flex items-center gap-2 text-[10px] py-0.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300">{entry.name}:</span>
              <span className="font-bold text-white">{displayValue} {unit}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RunningLog({ isAdmin, workerUrl, adminPassword }) {
  const [data, setData] = useState({ monthly: [], gear: [], location: [] });
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    distance: '', time: '', pace: '', heart_rate: '', cadence: '', location: '', gear: '', memo: ''
  });

  useEffect(() => { if (workerUrl) fetchData(); }, [workerUrl]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!workerUrl) throw new Error('Worker URL Not Set');
      const res = await fetch(`${workerUrl}`, { method: 'GET' });
      const rawData = await res.json();
      
      // ✅ 1. 월별 통계 처리 (소수점 2자리 보정)
      const processedMonthly = (rawData.monthly || rawData.Monthly_Stats || []).map(item => ({
        ...item,
        total_distance: Math.round((parseFloat(item.total_distance) || 0) * 100) / 100,
        paceSec: paceToSeconds(item.avg_pace)
      }));

      // ✅ 2. 장비 데이터 처리 (숫자 타입 강제 변환)
      const processedGear = (rawData.gear || rawData.Gear_Status || []).map(g => ({
        ...g,
        total_km: Math.round((parseFloat(g.total_km) || 0) * 100) / 100
      }));

      // ✅ 3. 장소 데이터 처리 (숫자 타입 강제 변환)
      const processedLocation = (rawData.location || rawData.Location_Stats || []).map(l => ({
        ...l,
        total_run: parseInt(l.total_run, 10) || 0
      }));

      setData({
        monthly: processedMonthly,
        gear: processedGear,
        location: processedLocation
      });
    } catch (e) { console.warn("Fetch Error:", e.message); }
    finally { setLoading(false); }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
        setFormData(prev => ({ ...prev, distance: '', time: '', heart_rate: '', cadence: '', memo: '' }));
      }
    } catch (e) { alert('저장 실패'); }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 pb-10">
      {/* 관리자 폼 */}
      {isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2 text-indigo-400">
            <CheckCircle2 size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest">Manual Record</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="bg-slate-900/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
            <input type="number" step="0.01" name="distance" placeholder="Distance (km)" value={formData.distance} onChange={handleInputChange} className="bg-slate-900/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
            <input type="text" name="time" placeholder="Time (HH:MM:SS)" value={formData.time} onChange={handleInputChange} className="bg-slate-900/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
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
            <input type="number" name="heart_rate" placeholder="HR" value={formData.heart_rate} onChange={handleInputChange} className="bg-slate-900/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
            <input type="number" name="cadence" placeholder="CAD" value={formData.cadence} onChange={handleInputChange} className="bg-slate-900/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none" />
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest">Save Record</button>
        </form>
      )}

      {/* 대시보드 */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-6 text-indigo-400 font-black text-xs uppercase tracking-widest">
          <Activity size={16} /> Monthly Growth
        </div>
        <div className="h-64 w-full">
          {!loading && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" hide />
                <YAxis yAxisId="right" orientation="right" reversed={true} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatPace} domain={['dataMin - 15', 'dataMax + 15']} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar yAxisId="left" dataKey="total_distance" name="거리" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                <Line yAxisId="left" type="monotone" dataKey="avg_heart_rate" name="심박" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} />
                <Line yAxisId="right" type="monotone" dataKey="paceSec" name="페이스" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 장비 상태 */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-amber-400 font-black text-xs uppercase tracking-widest"><Zap size={16} /> Gear Status</div>
          <div className="space-y-4">
            {data.gear.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                <span className="text-xs font-bold text-slate-200">{item.gear}</span>
                <span className="text-[10px] font-black text-indigo-400">{item.total_km} km</span>
              </div>
            ))}
            {data.gear.length === 0 && <p className="text-[10px] text-slate-500 text-center py-4">데이터 없음</p>}
          </div>
        </div>

        {/* 장소 통계 */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-emerald-400 font-black text-xs uppercase tracking-widest"><MapPin size={16} /> Location Stats</div>
          <div className="space-y-4">
            {data.location.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                <span className="text-xs font-bold text-slate-200">{item.location}</span>
                <span className="text-[10px] font-black text-emerald-400">{item.total_run} 회</span>
              </div>
            ))}
            {data.location.length === 0 && <p className="text-[10px] text-slate-500 text-center py-4">데이터 없음</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
