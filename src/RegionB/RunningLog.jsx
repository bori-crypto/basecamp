import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { Activity, Footprints, MapPin, Gauge, PlusCircle } from 'lucide-react';

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
        <p className="font-black mb-2 border-b border-white/10 pb-1 text-indigo-300 uppercase tracking-tighter">{label} 기록</p>
        {payload.map((entry, index) => {
          const value = entry.dataKey === 'paceSec' ? formatPace(entry.value) : entry.value;
          // 한글화 단위 설정
          const unit = entry.dataKey === 'total_distance' ? 'km' : 
                       entry.dataKey === 'avg_heart_rate' ? 'bpm' : 
                       entry.dataKey === 'total_km' ? 'km' : 
                       entry.dataKey === 'total_run' ? '회' : '';
          
          // 소수점 처리 방어 로직 추가
          const displayValue = typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value;

          return (
            <div key={index} className="flex items-center gap-2 my-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-slate-400 font-medium">{entry.name}:</span>
              <span className="font-bold text-slate-100">{displayValue} {unit}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RunningLog({ isAdmin = true, workerUrl = "", adminPassword = "" }) {
  const [data, setData] = useState({ monthly: [], gear: [], location: [] });
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    distance: '', time: '', pace: '', heart_rate: '', cadence: '', location: '', gear: '', memo: ''
  });

  useEffect(() => {
    fetchData();
  }, [workerUrl]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!workerUrl) throw new Error('Worker URL Not Set');
      const res = await fetch(`${workerUrl}`, { method: 'GET' });
      if (!res.ok) throw new Error('Fetch Failed');
      
      const rawData = await res.json();
      
      const processedMonthly = (rawData.monthly || rawData.Monthly_Stats || []).map(item => ({
        ...item,
        paceSec: paceToSeconds(item.avg_pace)
      }));

      setData({ 
        monthly: processedMonthly,
        // 숫자 데이터로 변환 (파이 차트 렌더링을 위해)
        gear: (rawData.gear || rawData.Gear_Status || []).map(g => ({
          ...g,
          total_km: parseFloat(g.total_km) || 0
        })),
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
      const res = await fetch(`${workerUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': adminPassword
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        alert('기록이 저장되었습니다! 🏃‍♂️');
        fetchData();
        setFormData({ ...formData, distance: '', time: '', pace: '', heart_rate: '', cadence: '', memo: '' });
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('네트워크 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
      
      {/* [A] 관리자 전용 입력 폼 */}
      {isAdmin && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-indigo-400">
            <PlusCircle size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest">새 기록 입력</h2>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">날짜</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">거리 (km)</label>
                <input type="number" step="0.1" name="distance" placeholder="0.0" value={formData.distance} onChange={handleInputChange} required className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">시간</label>
                <input type="text" name="time" placeholder="00:00:00" value={formData.time} onChange={handleInputChange} required className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">페이스</label>
                <input type="text" name="pace" placeholder="00:00" value={formData.pace} onChange={handleInputChange} required className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">심박수</label>
                <input type="number" name="heart_rate" placeholder="bpm" value={formData.heart_rate} onChange={handleInputChange} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">케이던스</label>
                <input type="number" name="cadence" placeholder="spm" value={formData.cadence} onChange={handleInputChange} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">장소</label>
                <select name="location" value={formData.location} onChange={handleInputChange} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all appearance-none">
                  <option value="" className="bg-slate-900">장소 선택</option>
                  {data.location.map((l, i) => <option key={i} value={l.location} className="bg-slate-900">{l.location}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">장비</label>
                <select name="gear" value={formData.gear} onChange={handleInputChange} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all appearance-none">
                  <option value="" className="bg-slate-900">장비 선택</option>
                  {data.gear.map((g, i) => <option key={i} value={g.gear} className="bg-slate-900">{g.gear}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-2">
              <input type="text" name="memo" placeholder="컨디션, 특이사항 등 메모..." value={formData.memo} onChange={handleInputChange} className="flex-1 bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all" />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95 whitespace-nowrap">
                저장하기
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white/5 rounded-[2rem] border border-white/5">
          <div className="flex flex-col items-center gap-3">
            <Activity className="text-indigo-500 animate-pulse" size={32} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">데이터 동기화 중...</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* ✅ [1행] 월별 성장 지표 (가로 전체 차지) */}
          <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 text-emerald-400">
                <Gauge size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">월별 성장 지표</h3>
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
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px' }} />
                  
                  <Bar yAxisId="left" dataKey="total_distance" name="거리" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                  <Line yAxisId="left" type="monotone" dataKey="avg_heart_rate" name="심박" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} />
                  <Line yAxisId="right" type="monotone" dataKey="paceSec" name="페이스" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} shadow="0 0 10px rgba(16,185,129,0.5)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ✅ [2행] 장비 및 코스 (나란히 반반 배치) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            
            {/* [C] 장비 상태 (Gear Life) */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 mb-6">
                <Footprints size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">장비 상태</h3>
              </div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
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
                {data.gear.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] px-2">
                    <span className="text-slate-400 font-bold uppercase">{item.gear}</span>
                    {/* ✅ 소수점 2자리로 잘라서 표시 */}
                    <span className="text-slate-100 font-black tracking-tighter">{Number(item.total_km).toFixed(2)} km</span>
                  </div>
                ))}
              </div>
            </div>

            {/* [D] 코스별 기록 (Sector Dominance) */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl">
              <div className="flex items-center gap-2 text-purple-400 mb-6">
                <MapPin size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">코스 점유율</h3>
              </div>
              <div className="space-y-4">
                {data.location.map((item, idx) => {
                  const maxDist = Math.max(...data.location.map(l => l.total_run));
                  const percentage = (item.total_run / maxDist) * 100;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black px-1 tracking-tighter">
                        <span className="text-slate-300">{item.location}</span>
                        <span className="text-indigo-400">{item.total_run} 회</span>
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
