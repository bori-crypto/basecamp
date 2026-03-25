import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { Activity, Zap, MapPin, CheckCircle2 } from 'lucide-react';

// --- Pace calculation helpers ---
// GAS gives us Pace as "MM:SS" string. Recharts needs a number to plot on Y-axis.
const paceToSeconds = (paceStr) => {
  if (!paceStr) return 0;
  const parts = paceStr.split(':');
  if (parts.length !== 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

// Format seconds back to "MM:SS" for Y-axis and Tooltip
const formatPace = (seconds) => {
  if (!seconds) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function RunningLog({ isAdmin, workerUrl, adminPassword }) {
  const [data, setData] = useState({ monthly: [], gear: [], location: [] });
  const [loading, setLoading] = useState(true);

  // Form state for Manual Entry (Admin only)
  // Fields must match "러닝 데이터 아키텍처 설계 완료" doc
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    distance: '',
    time: '',
    pace: '', // Calculated from GAS, not a user input
    heart_rate: '',
    cadence: '',
    location: '', // Dropdown
    gear: '',     // Dropdown
    memo: ''
  });

  useEffect(() => {
    if (workerUrl) {
      fetchData();
    }
  }, [workerUrl]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${workerUrl}`);
      const rawData = await res.json();

      // Transform Pace strings ("MM:SS") into numbers (seconds) for Recharts
      const processedMonthly = (rawData.Monthly_Stats || []).map(d => ({
        month: d.month,
        total_distance: parseFloat(d.total_distance) || 0,
        paceSec: paceToSeconds(d.avg_pace) // Avg Pace is stored as MM:SS string in GAS
      }));

      setData({
        monthly: processedMonthly,
        gear: rawData.Gear_Status || [],
        location: rawData.Location_Stats || []
      });
    } catch (e) {
      console.error("Running data fetch failed:", e);
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

    // Basic validation (Matching standard entry requirement)
    if (!formData.distance || !formData.time) {
      alert("Distance and Time are required.");
      return;
    }

    try {
      const res = await fetch(`${workerUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': adminPassword // AppContext provided password
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('Running log saved successfully! 🏃‍♂️');
        fetchData(); // Refresh dashboard data
        // Reset the form, keeping the dropdown selections
        setFormData(prev => ({ ...prev, distance: '', time: '', heart_rate: '', cadence: '', memo: '' }));
      } else {
        const error = await res.json();
        alert(`Save failed: ${error.error}`);
      }
    } catch (e) {
      console.error("Save Error:", e);
      alert('Record save failed. Please check network.');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 pb-10">

      {/* 1. Manual Entry Form (Admin Only) */}
      {isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2 text-indigo-400">
            <CheckCircle2 size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest">Manual Entry</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Date (DatePicker) */}
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="bg-slate-900/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
            />

            {/* Distance (Number - km) */}
            <input
              type="number"
              step="0.01"
              name="distance"
              placeholder="Distance (km)"
              value={formData.distance}
              onChange={handleInputChange}
              required
              className="bg-slate-900/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
            />

            {/* Time (HH:MM:SS) */}
            <input
              type="text"
              name="time"
              placeholder="Time (HH:MM:SS)"
              value={formData.time}
              onChange={handleInputChange}
              required
              className="bg-slate-900/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Location (Dropdown - populated from Location_Stats) */}
            <select
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
            >
              <option value="">Location</option>
              {data.location.map((l, i) => (
                <option key={i} value={l.location}>{l.location}</option>
              ))}
            </select>

            {/* Gear (Dropdown - populated from Gear_Status) */}
            <select
              name="gear"
              value={formData.gear}
              onChange={handleInputChange}
              required
              className="bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
            >
              <option value="">Gear</option>
              {data.gear.map((g, i) => (
                <option key={i} value={g.gear}>{g.gear}</option>
              ))}
            </select>

            {/* Heart Rate (Number - bpm) */}
            <input
              type="number"
              name="heart_rate"
              placeholder="HR (bpm)"
              value={formData.heart_rate}
              onChange={handleInputChange}
              className="bg-slate-900/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
            />

            {/* Cadence (Number - spm) */}
            <input
              type="number"
              name="cadence"
              placeholder="Cadence (spm)"
              value={formData.cadence}
              onChange={handleInputChange}
              className="bg-slate-900/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
            />
          </div>

          {/* Memo */}
          <input
            type="text"
            name="memo"
            placeholder="Memo (optional)"
            value={formData.memo}
            onChange={handleInputChange}
            className="bg-slate-900/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
          />

          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
            SAVE LOG
          </button>
        </form>
      )}

      {/* 2. Monthly Growth Dashboard (Chart) */}
      {/* Layout matches image_96f4e3.jpg */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-6 text-indigo-400 font-black text-xs uppercase tracking-widest">
          <Activity size={16} /> Monthly Growth
        </div>
        <div className="h-64 w-full">
          {!loading && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                {/* Y-Axis 1: Distance (Bar) - Left */}
                <YAxis yAxisId="left" hide />
                {/* Y-Axis 2: Pace (Line) - Right, Reversed (lower is faster) */}
                <YAxis yAxisId="right" orientation="right" reversed={true} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatPace} domain={['dataMin - 15', 'dataMax + 15']} />
                {/* Tooltip with English names */}
                <RechartsTooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(value, name, props) => name === 'paceSec' ? [formatPace(value), 'Avg Pace'] : [value.toFixed(2) + ' km', 'Distance']} labelStyle={{ color: '#475569' }} />
                {/* Legend in English */}
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} formatter={(value) => value === 'total_distance' ? 'Distance' : 'Avg Pace'} />
                {/* Bar for Distance (km) */}
                <Bar yAxisId="left" dataKey="total_distance" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                {/* Line for Pace (Seconds, calculated from GAS data) */}
                <Line yAxisId="right" type="monotone" dataKey="paceSec" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Gear Status and Location Stats (Lists) */}
      {/* Layout matches image_96f4e3.jpg (Grid 2 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gear Status (Bottom-left) */}
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

        {/* Location Stats (Bottom-right) */}
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
