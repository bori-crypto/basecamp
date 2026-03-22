import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell, BarChart
} from 'recharts';

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

// --- 커스텀 툴팁 ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/70 backdrop-blur-md border border-white/20 p-3 rounded-lg text-white text-sm shadow-xl z-50">
        <p className="font-bold mb-2 border-b border-white/30 pb-1">{label}</p>
        {payload.map((entry, index) => {
          const value = entry.dataKey === 'paceSec' ? formatPace(entry.value) : entry.value;
          let unit = '';
          if (entry.dataKey === 'distance' || entry.dataKey === 'mileage') unit = 'km';
          if (entry.dataKey === 'heart_rate') unit = 'bpm';
          if (entry.dataKey === 'cadence') unit = 'spm';
          return (
            <div key={index} className="flex items-center gap-2 my-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-gray-300">{entry.name}:</span>
              <span className="font-semibold">{value} {unit}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RunningLog({ isAdmin, workerUrl, adminPassword }) {
  // 초기 상태 방어 로직 (null 에러 방지)
  const [data, setData] = useState({ monthly: [], gear: [], location: [], datasource: [] });
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    distance: '', time: '', heart_rate: '', cadence: '', location: '', gear: '', memo: ''
  });

  useEffect(() => { 
    if (workerUrl) fetchData(); 
  }, [workerUrl]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ✅ 문법 교정: 백스틱(``) 적용
      const res = await fetch(`${workerUrl}`, { method: 'GET' });
      if (!res.ok) throw new Error('Network response was not ok');
      const rawData = await res.json();
      
      const processedMonthly = (rawData.monthly || []).map(item => ({
        ...item,
        paceSec: paceToSeconds(item.pace)
      }));

      setData({ 
        monthly: processedMonthly, 
        gear: rawData.gear || [], 
        location: rawData.location || [], 
        datasource: rawData.datasource || [] 
      });
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally { 
      setLoading(false); 
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert('관리자 권한이 필요합니다.');

    try {
      // ✅ 문법 교정: 백스틱(``) 적용
      const res = await fetch(`${workerUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': adminPassword
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        alert('기록 성공!');
        fetchData();
        setFormData({ ...formData, distance: '', time: '', heart_rate: '', cadence: '', memo: '' });
      } else { 
        alert('저장 실패: 관리자 암호나 서버 상태를 확인하세요.'); 
      }
    } catch (error) { 
      alert('네트워크 오류 발생'); 
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-white">
      {/* 입력 폼 (모바일 최적화) */}
      {isAdmin && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-lg">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">⚡ 새 러닝 기록 입력</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} required 
                className="bg-black/40 border border-white/10 rounded-xl p-3 text-white h-12" />
              <input type="number" step="0.1" inputMode="decimal" name="distance" placeholder="거리 (km)" value={formData.distance} onChange={handleInputChange} required 
                className="bg-black/40 border border-white/10 rounded-xl p-3 text-white h-12" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input type="text" name="time" placeholder="00:00:00" value={formData.time} onChange={handleInputChange} required 
                className="bg-black/40 border border-white/10 rounded-xl p-3 text-white h-12" />
              <input type="number" inputMode="numeric" name="heart_rate" placeholder="심박" value={formData.heart_rate} onChange={handleInputChange}
                className="bg-black/40 border border-white/10 rounded-xl p-3 text-white h-12" />
              <input type="number" inputMode="numeric" name="cadence" placeholder="케이던스" value={formData.cadence} onChange={handleInputChange}
                className="bg-black/40 border border-white/10 rounded-xl p-3 text-white h-12" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select name="location" value={formData.location} onChange={handleInputChange} className="bg-black/40 border border-white/10 rounded-xl p-3 h-12">
                <option value="">장소 선택</option>
                {data.location.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
              </select>
              <select name="gear" value={formData.gear} onChange={handleInputChange} className="bg-black/40 border border-white/10 rounded-xl p-3 h-12">
                <option value="">장비 선택</option>
                {data.gear.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
              </select>
            </div>

            <button type="submit" className="bg-blue-600 py-4 rounded-xl font-bold">기록 저장하기</button>
          </form>
        </div>
      )}

      {/* 통계 차트 구역 */}
      {loading ? (
        <div className="text-center py-10 animate-pulse text-gray-400">데이터 동기화 중...</div>
      ) : (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-lg relative z-10">
          <h3 className="text-lg font-bold mb-4">📈 통계</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" reversed={true} stroke="#94a3b8" fontSize={11} tickFormatter={formatPace} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="distance" name="거리" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="left" type="monotone" dataKey="heart_rate" name="심박" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="paceSec" name="페이스" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
