import React, { useState, createContext, useContext, useMemo } from 'react';
import { 
  Activity, Map as MapIcon, BarChart2, 
  Shield, ShieldOff, ChevronRight, 
  Settings, Database, Server, Clock,
  ChevronLeft, Home, Layers
} from 'lucide-react';

// ==========================================
// 1. 전역 상태 (Context) - 라우팅 및 보안 모드
// ==========================================
const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [history, setHistory] = useState([{ id: 'home', title: 'Dashboard', icon: Home }]);

  const togglePrivateMode = () => setIsPrivateMode(!isPrivateMode);
  
  const pushPage = (id, title, icon) => {
    setHistory(prev => [...prev, { id, title, icon }]);
  };

  const popPage = () => {
    if (history.length > 1) {
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const jumpTo = (index) => {
    setHistory(prev => prev.slice(0, index + 1));
  };

  const currentPage = useMemo(() => history[history.length - 1], [history]);

  return (
    <AppContext.Provider value={{ 
      isPrivateMode, togglePrivateMode, 
      history, currentPage, pushPage, popPage, jumpTo 
    }}>
      {children}
    </AppContext.Provider>
  );
};

// ==========================================
// 2. 브레드크럼 컴포넌트 (Navigation Trail)
// ==========================================
const Breadcrumbs = () => {
  const { history, jumpTo, popPage } = useContext(AppContext);

  if (history.length <= 1) return null;

  return (
    <div className="flex items-center space-x-2 mb-8 animate-in fade-in slide-in-from-left-4 duration-700 px-2">
      <button 
        onClick={popPage}
        className="mr-2 p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all border border-white/10 shadow-lg"
      >
        <ChevronLeft size={20} />
      </button>
      
      <div className="flex items-center space-x-1 bg-slate-800/40 backdrop-blur-xl px-5 py-2.5 rounded-[1.25rem] border border-white/15 shadow-2xl">
        {history.map((step, idx) => (
          <React.Fragment key={step.id}>
            <button 
              onClick={() => jumpTo(idx)}
              className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all
                ${idx === history.length - 1 ? 'text-indigo-400' : 'text-slate-300 hover:text-slate-100'}`}
            >
              {step.icon && <step.icon size={12} />}
              <span>{step.title}</span>
            </button>
            {idx < history.length - 1 && (
              <span className="text-slate-600 px-1 font-light opacity-50">/</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 3. 레이아웃 컴포넌트
// ==========================================
const Layout = ({ children }) => {
  const { isPrivateMode, togglePrivateMode, pushPage } = useContext(AppContext);

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-50 font-sans selection:bg-indigo-500/30 overflow-hidden relative flex flex-col">
      
      {/* Floating Security Toggle */}
      <div className="fixed top-4 right-6 z-50">
        <button 
          onClick={togglePrivateMode}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-[10px] font-black tracking-[0.15em] transition-all duration-500 border backdrop-blur-xl shadow-2xl
            ${isPrivateMode 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
              : 'bg-slate-800/40 text-slate-400 border-white/10 hover:border-white/20'}`}
        >
          {isPrivateMode ? <Shield size={12} className="animate-pulse" /> : <ShieldOff size={12} />}
          <span>{isPrivateMode ? 'ADMIN_SECURE' : 'GUEST_ACCESS'}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-4 lg:p-10">
        <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col pt-6">
          <Breadcrumbs />
          <div className="flex-1">
            {children}
          </div>
        </div>
      </main>

      {/* Admin Gear */}
      <div className="fixed bottom-6 right-6 z-50 opacity-40 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => pushPage('settings', 'System Config', Settings)} 
          className="p-3 bg-slate-900/80 rounded-full border border-white/10 text-slate-400 hover:text-white backdrop-blur-md"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 4. 위젯 카드 컴포넌트
// ==========================================
const WidgetCard = ({ title, icon: Icon, onClick, children }) => (
  <div 
    onClick={onClick}
    style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
    className="backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 lg:p-14
      hover:border-indigo-400/40 transition-all duration-500 cursor-pointer
      group flex flex-col h-full min-h-[360px] lg:min-h-[420px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]
      active:scale-[0.98] active:duration-150"
  >
    <div className="flex items-center justify-between mb-10">
      <div className="flex items-center space-x-5 text-slate-400 group-hover:text-indigo-300 transition-all duration-500 group-hover:translate-x-1">
        <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/10 group-hover:border-indigo-500/40 transition-all shadow-inner">
          <Icon size={28} />
        </div>
        <h3 className="font-black text-2xl lg:text-3xl tracking-tighter uppercase text-slate-100">{title}</h3>
      </div>
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 group-hover:bg-indigo-500/30 text-slate-500 group-hover:text-indigo-200 transition-all border border-white/5 group-hover:border-indigo-500/40">
        <ChevronRight size={28} />
      </div>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      {children}
    </div>
  </div>
);

// ==========================================
// 5. 페이지 컴포넌트
// ==========================================

const Dashboard = () => {
  const { isPrivateMode, pushPage } = useContext(AppContext);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 py-2 animate-in fade-in zoom-in-95 duration-1000">
      <WidgetCard title="Trajectory" icon={Activity} onClick={() => pushPage('trajectory', 'Trajectory Hub', Activity)}>
        <div className="relative pl-6 border-l-2 border-slate-700/60 space-y-6 py-2">
          <div className="relative">
            <div className="absolute -left-[24px] top-2 w-4 h-4 bg-indigo-500 rounded-full ring-4 ring-[#1e293b] shadow-[0_0_20px_rgba(99,102,241,0.6)]"></div>
            <p className="text-lg font-black text-slate-100 uppercase tracking-tighter">System Evolution</p>
            <p className="text-sm text-slate-400 font-medium tracking-tight">Visibility Optimized</p>
          </div>
        </div>
        {isPrivateMode && (
          <div className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-xs text-emerald-300 leading-relaxed italic animate-in slide-in-from-top-2 duration-500">
            "오빠, 서브 페이지도 이제 쨍하게 보일 거야!"
          </div>
        )}
      </WidgetCard>

      <WidgetCard title="Roadmap" icon={MapIcon} onClick={() => pushPage('roadmap', 'Strategic Map', MapIcon)}>
        <div className="space-y-8 py-2">
          <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest px-1">
            <span className="text-slate-400">Strategic Progress</span>
            <span className="text-indigo-300 text-3xl font-black">68%</span>
          </div>
          <div className="w-full bg-slate-900/80 rounded-full h-3.5 p-1 border border-white/10 shadow-inner">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-full shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: '68%' }}></div>
          </div>
        </div>
      </WidgetCard>

      <WidgetCard title="Data Hub" icon={BarChart2} onClick={() => pushPage('data', 'Analytical Core', BarChart2)}>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-900/60 p-6 rounded-[2rem] border border-white/10 text-center hover:border-indigo-500/30 transition-all shadow-inner">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Network Load</p>
            <p className="text-2xl font-black text-slate-50 uppercase tracking-tighter">14<span className="text-[10px] text-slate-500 ml-1 font-normal">ms</span></p>
          </div>
          <div className="bg-slate-900/60 p-6 rounded-[2rem] border border-white/10 text-center hover:border-indigo-500/30 transition-all shadow-inner">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Active Node</p>
            <p className="text-2xl font-black text-slate-50 uppercase tracking-tighter">07<span className="text-[10px] text-slate-500 ml-1 font-normal">pts</span></p>
          </div>
        </div>
      </WidgetCard>

      <WidgetCard title="System" icon={Server} onClick={() => pushPage('settings', 'System Config', Settings)}>
        <div className="p-8 bg-slate-900/60 rounded-[2.5rem] border border-white/10 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-5">
             <div className="p-3.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/5">
                <Database size={24} />
             </div>
             <div>
               <p className="text-sm font-black text-slate-100 uppercase tracking-tight">Cloudflare Edge</p>
               <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest">Connected via D1</p>
             </div>
          </div>
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981]"></span>
            <span className="absolute w-5 h-5 rounded-full bg-emerald-500/20 animate-ping"></span>
          </div>
        </div>
      </WidgetCard>
    </div>
  );
};

// --- SUB-PAGE (모바일 밝기 개선 버전) ---
const SubPage = ({ id, title, icon: Icon }) => {
  const { pushPage } = useContext(AppContext);

  return (
    <div 
      style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)' }}
      className="h-full min-h-[60vh] flex flex-col items-center justify-center border border-white/20 rounded-[4rem] backdrop-blur-3xl animate-in slide-in-from-bottom-4 fade-in duration-700 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]"
    >
      <div className="w-28 h-28 rounded-[2.5rem] bg-indigo-500/20 border border-white/20 flex items-center justify-center text-indigo-300 mb-8 shadow-2xl shadow-indigo-500/20 group">
        <Icon size={56} className="group-hover:scale-110 transition-transform duration-500" />
      </div>
      
      <h2 className="text-5xl font-black text-slate-50 mb-4 uppercase tracking-tighter italic text-center drop-shadow-2xl">
        {title}
      </h2>
      
      <p className="text-slate-200 mb-12 max-w-sm text-center text-[12px] font-black uppercase tracking-[0.3em] leading-relaxed drop-shadow-md">
        Interactive Workspace <br/>
        Layer: <span className="text-indigo-400">{id.toUpperCase()}</span>
      </p>
      
      <div className="flex flex-wrap justify-center gap-4">
        <button 
          onClick={() => pushPage(`${id}-detail`, `${title} Details`, Layers)}
          className="px-14 py-5 bg-indigo-500 hover:bg-indigo-400 text-white border border-indigo-300/30 rounded-[2rem] transition-all font-black text-[11px] uppercase tracking-[0.25em] shadow-[0_20px_50px_-10px_rgba(79,70,229,0.6)] active:scale-95"
        >
          Explore Deeper
        </button>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { currentPage } = useContext(AppContext);

  return (
    <Layout>
      {currentPage.id === 'home' ? (
        <Dashboard />
      ) : (
        <SubPage id={currentPage.id} title={currentPage.title} icon={currentPage.icon} />
      )}
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
