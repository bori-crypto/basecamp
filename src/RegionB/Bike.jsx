import React, { useState } from 'react';
import { 
  MapPin, Navigation, Calendar, Flag, AlertCircle, Map as MapIcon, ChevronDown, ChevronUp, Plus
} from 'lucide-react';

export const BikeRouteFullMapView = ({ title }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const routeData = {
    title: title || 'SOUTH COAST 2026',
    duration: '2박 3일',
    distance: '약 450KM',
    waypoints: ['합천 해인사', '진주 촉석루', '남해 독일마을', '거제 바람의 언덕'],
    memo: '남해안 해안도로 위주의 와인딩 코스. 노면 상태 주의 및 F800GS 공기압 체크 필수.'
  };

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-[2.5rem] text-slate-100 animate-in fade-in duration-700 font-sans shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]">
      <div className="absolute inset-0 bg-slate-900 z-0">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
        <svg className="w-full h-full opacity-20" viewBox="0 0 800 600" preserveAspectRatio="none">
          <path d="M 100 500 C 200 450 300 550 400 400 S 600 300 750 100" fill="none" stroke="#6366f1" strokeWidth="4" strokeDasharray="12 12" />
        </svg>
      </div>

      <div className="relative z-10 p-6 h-full pointer-events-none">
        <div className={`w-full max-w-[270px] bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-5 shadow-2xl pointer-events-auto transition-all duration-500 ${isCollapsed ? 'max-h-24' : 'max-h-[90%] overflow-y-auto scrollbar-hide'}`}>
          <div className="cursor-pointer select-none" onClick={() => setIsCollapsed(!isCollapsed)}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <div className="mt-1 p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30"><MapPin className="text-indigo-400" size={16} /></div>
                <div>
                  <h3 className="text-lg font-black tracking-tighter text-white uppercase leading-tight">{routeData.title}</h3>
                  <p className="text-[9px] text-indigo-400/70 font-bold tracking-[0.15em] mt-1 uppercase">Mission Brief</p>
                </div>
              </div>
              <div className="text-slate-500 mt-1">{isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</div>
            </div>
          </div>
          {!isCollapsed && (
            <div className="mt-5 space-y-5 animate-in slide-in-from-top-2">
              <div className="flex gap-1.5 text-[9px] font-black uppercase text-slate-300">
                <span className="bg-white/5 px-2.5 py-1.5 rounded-full border border-white/10 flex items-center gap-1"><Calendar size={10} className="text-indigo-400" /> {routeData.duration}</span>
                <span className="bg-white/5 px-2.5 py-1.5 rounded-full border border-white/10 flex items-center gap-1"><Navigation size={10} className="text-indigo-400" /> {routeData.distance}</span>
              </div>
              <div className="space-y-3">
                <h4 className="text-[9px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-[0.2em] ml-1"><Flag size={12} className="text-indigo-500" /> Waypoints</h4>
                <div className="flex flex-col gap-2 relative ml-1">
                  <div className="absolute left-[11px] top-3 bottom-3 w-[1px] bg-indigo-500/20" />
                  {routeData.waypoints.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="relative z-10 w-6 h-6 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-[8px] font-black text-indigo-400">{idx + 1}</div>
                      <span className="text-xs font-bold text-slate-400">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-400/5 border border-amber-400/10 rounded-xl p-3.5">
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">"{routeData.memo}"</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2 opacity-30 pointer-events-none">
        <div className="w-9 h-9 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center font-black text-[10px]">+</div>
        <div className="w-9 h-9 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center font-black text-[10px]">-</div>
      </div>
    </div>
  );
};

export default function Bike({ step, path, onSelect }) {
  const year = path[1] || '2026';
  const [routes, setRoutes] = useState([`경상도 투어 ${year}`, `강원도 코스 ${year}`]);
  const [newRoute, setNewRoute] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newRoute.trim()) { setRoutes([...routes, newRoute.trim()]); setNewRoute(''); }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input type="text" value={newRoute} onChange={(e) => setNewRoute(e.target.value)} placeholder="새로운 코스 이름 입력" className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50 transition-all" />
        <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-2xl transition-all"><Plus size={24} /></button>
      </form>
      <div className="flex flex-col gap-3">
        {routes.map((route, idx) => (
          <div key={idx} onClick={() => onSelect(route)} className="group bg-white/5 border border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl cursor-pointer transition-all hover:bg-white/10 flex items-center justify-between">
            <span className="text-slate-100 font-medium">{route}</span>
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-400 opacity-20 group-hover:opacity-100 text-white"><MapPin size={16} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
