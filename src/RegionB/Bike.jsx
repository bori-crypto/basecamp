import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Calendar, 
  Flag, 
  AlertCircle, 
  Map as MapIcon, 
  ChevronDown,
  ChevronUp,
  Plus
} from 'lucide-react';

/**
 * [4단계] BikeRouteFullMapView
 * 오빠가 디자인한 지도를 전체 배경으로 사용하는 뷰야.
 */
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
    <div className="relative w-full h-full min-h-[600px] overflow-hidden rounded-[2.5rem] text-slate-100 animate-in fade-in duration-700 font-sans">
      
      {/* 🗺️ 배경: 지도 구역 (Full Canvas) */}
      <div className="absolute inset-0 bg-slate-900 z-0">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        
        {/* 지도 시뮬레이션 가이드 라인 */}
        <svg className="w-full h-full opacity-20" viewBox="0 0 800 600" preserveAspectRatio="none">
          <path d="M 100 500 C 200 450 300 550 400 400 S 600 300 750 100" fill="none" stroke="#6366f1" strokeWidth="4" strokeDasharray="12 12" />
          <circle cx="100" cy="500" r="8" fill="#6366f1" />
          <circle cx="750" cy="100" r="8" fill="#fbbf24" />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 opacity-20">
            <MapIcon size={120} strokeWidth={0.5} />
            <span className="text-xs font-black tracking-[0.4em] uppercase text-indigo-400">Tactical Navigation Active</span>
          </div>
        </div>
      </div>

      {/* 📋 전경: 플로팅 정보 패널 (크기 70% 축소 및 롤업 기능) */}
      <div className="relative z-10 p-6 h-full pointer-events-none">
        <div className={`w-full max-w-[270px] bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-5 shadow-2xl pointer-events-auto flex flex-col transition-all duration-500 ease-in-out ${isCollapsed ? 'max-h-24' : 'max-h-[90%] overflow-y-auto scrollbar-hide'}`}>
          
          {/* 1. 상단 헤더 (클릭 시 롤업 토글) */}
          <div 
            className="cursor-pointer group select-none"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <div className="mt-1 p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                  <MapPin className="text-indigo-400" size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tighter text-white uppercase leading-tight group-hover:text-indigo-300 transition-colors">
                    {routeData.title}
                  </h3>
                  <p className="text-[9px] text-indigo-400/70 font-bold tracking-[0.15em] mt-1 uppercase">Mission Brief</p>
                </div>
              </div>
              <div className="text-slate-500 mt-1">
                {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </div>
            </div>
          </div>

          {/* 롤업 시 숨겨지는 영역 */}
          {!isCollapsed && (
            <div className="mt-5 space-y-5 animate-in slide-in-from-top-2 duration-300">
              {/* 요약 배지 */}
              <div className="flex gap-1.5 text-[9px] font-black uppercase tracking-tight text-slate-300">
                <span className="bg-white/5 px-2.5 py-1.5 rounded-full border border-white/10 flex items-center gap-1">
                  <Calendar size={10} className="text-indigo-400" /> {routeData.duration}
                </span>
                <span className="bg-white/5 px-2.5 py-1.5 rounded-full border border-white/10 flex items-center gap-1">
                  <Navigation size={10} className="text-indigo-400" /> {routeData.distance}
                </span>
              </div>

              {/* 경유지 리스트 */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-[0.2em] ml-1">
                  <Flag size={12} className="text-indigo-500" /> Waypoints
                </h4>
                <div className="flex flex-col gap-2 relative ml-1">
                  <div className="absolute left-[11px] top-3 bottom-3 w-[1px] bg-indigo-500/20" />
                  {routeData.waypoints.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="relative z-10 w-6 h-6 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-inner">
                        <span className="text-[8px] font-black text-indigo-400">
                          {idx + 1}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-400 truncate">
                        {point}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 투어 메모 */}
              <div className="bg-amber-400/5 border border-amber-400/10 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertCircle size={12} className="text-amber-400" />
                  <span className="text-[9px] font-black text-amber-400/80 uppercase tracking-widest">Tech Memo</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">
                  "{routeData.memo}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽 하단: 지도 컨트롤 (투명도 유지) */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2 opacity-30 pointer-events-none">
        <div className="w-9 h-9 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center font-black text-[10px]">+</div>
        <div className="w-9 h-9 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center font-black text-[10px]">-</div>
      </div>
    </div>
  );
};

/**
 * [3단계] 메인 진입점 컴포넌트 (위젯 추가 폼 + 리스트)
 */
export default function Bike({ step, path, onSelect }) {
  const year = path[1] || '2026';
  
  // 프론트엔드 임시 상태 (나중에 DB나 GAS 연동 필요)
  const [routes, setRoutes] = useState([
    `경상도 투어 ${year}`,
    `강원도 코스 ${year}`,
  ]);
  const [newRoute, setNewRoute] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newRoute.trim()) {
      setRoutes([...routes, newRoute.trim()]);
      setNewRoute('');
    }
  };

  // 4단계(맵 뷰)로 넘어간 상태라면 맵을 렌더링해!
  if (step === 3) {
    return <BikeRouteFullMapView title={path[2]} />;
  }

  // 3단계: 위젯 추가 폼 및 기존 리스트
  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      
      {/* 폼 영역: 이름 입력 및 추가 버튼 */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newRoute}
          onChange={(e) => setNewRoute(e.target.value)}
          placeholder="새로운 코스 이름 (예: 동해 일주)"
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-400 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
        />
        <button 
          type="submit" 
          className="bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={24} />
        </button>
      </form>

      {/* 리스트 영역: 2단계 서브메뉴 디자인 유지 */}
      <div className="flex flex-col gap-3">
        {routes.map((route, idx) => (
          <div
            key={idx}
            onClick={() => onSelect(route)}
            className="group bg-white/5 backdrop-blur-sm border border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl cursor-pointer transition-all hover:bg-white/10 flex items-center justify-between"
          >
            <span className="text-slate-100 font-medium">{route}</span>
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-400 opacity-20 group-hover:opacity-100 transition-all text-white">
              <MapPin size={16} />
            </div>
          </div>
        ))}
        {routes.length === 0 && (
          <div className="text-center text-slate-500 py-8 text-sm">
            등록된 코스가 없습니다. 위에서 새로 추가해주세요.
          </div>
        )}
      </div>
    </div>
  );
}
