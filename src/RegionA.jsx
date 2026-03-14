const MiniSparkline = ({ data, color }) => {
  if (!data || !Array.isArray(data) || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; 
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  }).join(' L ');

  return (
    <svg width="100%" height="40" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`M 0,100 L 0,${100 - ((data[0] - min) / range) * 100} L ${points} L 100,100 Z`} fill={`url(#grad-${color})`} stroke="none" />
      <path d={`M ${points}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const RegionA = ({ data, loading, error, onRetry, onScheduleClick }) => {
  const today = new Date();
  const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
  const dayStr = today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full opacity-40 py-10">
      <Loader2 className="animate-spin mb-3 text-indigo-400" size={32} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Region_A Syncing</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full text-rose-400 py-10">
      <AlertTriangle className="mb-3 opacity-40" size={32} />
      <button onClick={onRetry} className="text-[10px] font-black border border-rose-500/30 px-5 py-2.5 rounded-2xl hover:bg-rose-500/10 transition-all uppercase tracking-widest">Retry Connection</button>
    </div>
  );

  const s = data?.summary || {};

  return (
    <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-700">
      {/* Weather */}
      <div className="bg-slate-900/40 p-5 rounded-[2.5rem] border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-3xl font-black tracking-tighter text-slate-100">{s.temp || '--'}</span>
          <Sun className="text-yellow-400 w-6 h-6" />
        </div>
        <div className="flex items-center gap-1.5 text-sky-400 text-[10px] font-black uppercase tracking-tighter">
          <Wind size={12} /> {s.windSpeed || '0.0m/s'}
        </div>
      </div>

      {/* Schedule */}
      <div 
        onClick={onScheduleClick}
        className="bg-indigo-500/10 p-5 rounded-[2.5rem] border border-indigo-500/20 flex flex-col justify-between cursor-pointer hover:bg-indigo-500/20 transition-all group/sch"
      >
        <div className="flex justify-between items-center text-indigo-400">
          <span className="text-[11px] font-black tracking-widest uppercase">{dateStr} {dayStr}</span>
          <ChevronRight size={14} className="group-hover/sch:translate-x-1 transition-transform" />
        </div>
        <div className="text-3xl font-black text-slate-100 leading-none flex items-baseline gap-1.5">
          {s.leftToday || '0'}<span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Items</span>
        </div>
      </div>

      {/* Market */}
      <div className="bg-slate-900/40 p-5 rounded-[2.5rem] border border-white/5 flex flex-col justify-between relative overflow-hidden group/mkt">
        <div className="flex justify-between items-start relative z-10">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.marketIndex?.name || 'Index'}</span>
          <span className={`text-[10px] font-black ${s.marketIndex?.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>{s.marketIndex?.change || '0.0%'}</span>
        </div>
        <div className="text-xl font-bold text-slate-100 relative z-10 tracking-tight">{s.marketIndex?.value || '--'}</div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20 pointer-events-none">
          <MiniSparkline data={s.marketIndex?.trend} color={s.marketIndex?.isUp ? '#10b981' : '#f43f5e'} />
        </div>
      </div>

      {/* Exchange */}
      <div className="bg-slate-900/40 p-5 rounded-[2.5rem] border border-white/5 flex flex-col justify-between">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
          <DollarSign size={10} /> USD/KRW
        </div>
        <div className="text-xl font-bold text-slate-100 tracking-tighter">{s.exchange?.rate || '--'}</div>
        <div className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
           <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></span>
           {s.exchange?.change || '0.0'}
        </div>
      </div>
    </div>
  );
};
