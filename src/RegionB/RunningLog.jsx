import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend
} from 'recharts';

// --- 헬퍼 함수: 페이스(MM:SS)를 초 단위로 변환 ---
const paceToSeconds = (paceStr) => {
  if (!paceStr) return 0;
  const str = String(paceStr);
  const parts = str.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1]; // MM:SS
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
  return 0;
};

// --- 초 단위를 다시 페이스(MM:SS)로 변환 ---
const formatPace = (seconds) => {
  if (!seconds) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
};

// --- 커스텀 툴팁 ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-md border border-white/20 p-3 rounded-lg text-white text-xs shadow-xl z-50">
        <p className="font-bold mb-2 border-b border-white/30 pb-1">{label}</p>
        {payload.map((entry, index) => {
          const value = entry.dataKey === 'paceSec' ? formatPace(entry.value) : entry.value;
          let unit = '';
          if (entry.dataKey === 'total_distance') unit = 'km';
          if (entry.dataKey === 'avg_heart_rate') unit = 'bpm';
          return (
            <div key={index} className="flex items-center gap-2 my-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-gray-400">{entry.name}:</span>
              <span className="font-semibold">{value} {unit}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
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
      
      const processedMonthly = (rawData.monthly || []).map(item => ({
        ...item,
        total_distance: Number(item.total_distance) || 0,
        avg_heart_rate: Number(item.avg_heart_rate) || 0,
        paceSec: paceToSeconds(item.avg_pace) 
      }));

      setData({ 
        monthly: processedMonthly, 
        gear: rawData.gear || [], 
        location: rawData.location || [] 
      });
    } catch (error) {
      console.error("Data load failed:", error);
    } finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="flex flex-col gap-6 w-full text-white pb-10">
      
      {isAdmin && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-lg">
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
              {/* ✅ 장소 목록 렌더링 수정 */}
              <select name="location" value={formData.location} onChange={handleInputChange} 
                className="bg-black/40 border border-white/10 rounded-xl p-3 h-12 outline-none appearance-none">
                <option value="">장소 선택</option>
                {data.location.map((l, i) => {
                  const val = l.location || Object.values(l)[0];
                  return <option key={i} value={val}>{val}</option>;
                })}
              </select>
              {/* ✅ 장비 목록 렌더링 수정 */}
              <select name="gear" value={formData.gear} onChange={handleInputChange} 
                className="bg-black/40 border border-white/10 rounded-xl p-3 h-12 outline-none appearance-none">
                <option value="">장비 선택</option>
                {data.gear.map((g, i) => {
                  const val = g.gear || Object.values(g)[0];
                  return <option key={i} value={val}>{val}</option>;
                })}
              </select>
            </div>

            <input type="text" name="memo" placeholder="메모 (컨디션 등)" value={formData.memo} onChange={handleInputChange}
              className="bg-black/40 border border-white/10 rounded-xl p-3 text-white h-12 outline-none" />

            <button type="submit" className="bg-blue-600 active:scale-95 transition-all py-4 rounded-xl font-bold shadow-lg mt-2">
              기록 저장하기
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 animate-pulse text-gray-500 text-xs">Synchronizing...</div>
      ) : (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-lg">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">📈 통계</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthly} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickMargin={10} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" reversed stroke="#64748b" fontSize={10} tickFormatter={formatPace} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                <Bar yAxisId="left" dataKey="total_distance" name="거리" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={18} />
                <Line yAxisId="left" type="monotone" dataKey="avg_heart_rate" name="심박" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} />
                <Line yAxisId="right" type="monotone" dataKey="paceSec" name="페이스" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
