import React, { useState, createContext, useContext, useMemo } from 'react';
import { 
  Activity, Map as MapIcon, BarChart2, 
  Shield, ShieldOff, ChevronRight, 
  Settings, Database, Server, Clock,
  ChevronLeft, Home, Layers
} from 'lucide-react';

const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [history, setHistory] = useState([{ id: 'home', title: 'Dashboard', icon: Home }]);
  const togglePrivateMode = () => setIsPrivateMode(!isPrivateMode);
  const pushPage = (id, title, icon) => setHistory(prev => [...prev, { id, title, icon }]);
  const popPage = () => { if (history.length > 1) setHistory(prev => prev.slice(0, -1)); };
  const jumpTo = (index) => setHistory(prev => prev.slice(0, index + 1));
  const currentPage = useMemo(() => history[history.length - 1], [history]);

  return (
    <AppContext.Provider value={{ isPrivateMode, togglePrivateMode, history, currentPage, pushPage, popPage, jumpTo }}>
      {children}
    </AppContext.Provider>
  );
};

const Breadcrumbs = () => {
  const { history, jumpTo, popPage } = useContext(AppContext);
  if (history.length <= 1) return null;
  return (
    <div className="flex items-center space-x-2 mb-8 animate-in fade-in slide-in-from-left-4 duration-700">
      <button onClick={popPage} className="mr-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5">
        <ChevronLeft size={18} />
      </button>
      <div className="flex items-center space-x-1 bg-black/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
        {history.map((step, idx) => (
          <React.Fragment key={step.id}>
            <button onClick={() => jumpTo(idx)} className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${idx === history.length - 1 ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
              {step.icon && <step.icon size={12} />}
              <span>{step.title}</span>
            </button>
            {idx < history.length - 1 && <span className="text-slate-700 px-1 font-light opacity-50">/</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  const { isPrivateMode, togglePrivateMode, pushPage } = useContext(AppContext);
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 font-sans selection:bg-indigo-500/30 overflow-hidden relative flex flex-col">
      <div className="fixed top-4 right-6 z-50">
        <button onClick={togglePrivateMode} className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[9px] font-black tracking-[0.15em] transition-all duration-500 border backdrop-blur-md ${isPrivateMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-900/40 text-slate-500 border-slate-800/40 hover:border-slate-700'}`}>
          {isPrivateMode ? <Shield size={10} className="animate-pulse" /> : <ShieldOff size={10} />}
          <span>{isPrivateMode ? 'ADMIN_SECURE' : 'GUEST_ACCESS'}</span>
        </button>
      </div>
      <main className="flex-1 overflow-y-auto relative p-4 lg:p-8">
        <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col pt-4">
          <Breadcrumbs />
          <div className="flex-1">{children}</div>
        </div>
      </main>
      <div className="fixed bottom-4 right-6 z-50 opacity-10 hover:opacity-100 transition-opacity">
        <button onClick={() => pushPage('settings', 'System Config', Settings)} className="p-2 text-slate-400"><Settings size={14} /></button>
      </div>
    </div>
  );
};

const WidgetCard = ({ title, icon: Icon, onClick, children }) => (
  <div onClick={onClick} style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)' }} className="backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 lg:p-14 hover:border-indigo-500/30 transition-all duration-700 cursor-pointer group flex flex-col h-full min-h-[380px] lg:min-h-[420px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)]">
    <div className="flex items-center justify-between mb-10">
      <div className="flex items-center space-x-5 text-slate-500 group-hover:text-indigo-400 transition-all duration-500 group-hover:translate-x-1">
        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 group-hover:border-indigo-500/30 transition-all"><Icon size={28} /></div>
        <h3 className="font-black text-2xl lg:text-3xl tracking-tighter uppercase">{title}</h3>
      </div>
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-indigo-500/20 text-slate-700 group-hover:text-indigo-400 transition-all border border-transparent group-hover:border-indigo-500/20"><ChevronRight size={28} /></div>
    </div>
    <div className="flex-1 flex flex-col justify-center">{children}</div>
  </div>
);

const Dashboard = () => {
  const { isPrivateMode, pushPage } = useContext(AppContext);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 py-2 animate-in fade-in zoom-in-95 duration-700">
      <WidgetCard title="Trajectory" icon={Activity} onClick={() => pushPage('trajectory', 'Trajectory Hub', Activity)}>
        <div className="relative pl-6 border-l-2 border-slate-800/80 space-y-6 py-2">
          <div className="relative">
            <div className="absolute -left-[24px] top-2 w-4 h-4 bg-indigo-500 rounded-full ring-4 ring-[#020617] shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
            <p className="text-lg font-black text-slate-200 uppercase tracking-tighter">System Evolution</p>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Tree-based Routing Active</p>
          </div>
        </div>
        {isPrivateMode && <div className="mt-8 p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl text-xs text-emerald-400/80 leading-relaxed italic animate-in slide-in-from-top-2 duration-500">"오빠, 이제 경로가 한눈에 보여서 안 길을 잃을 거야. 브레드크럼 깔끔하지?"</div>}
      </WidgetCard>
      <WidgetCard title="Roadmap" icon={MapIcon} onClick={() => pushPage('roadmap', 'Strategic Map', MapIcon)}>
        <div className="space-y-8 py-2">
          <div className="flex justify-between items-end text-xs font-black uppercase tracking-widest px-1">
            <span className="text-slate-600">Strategic Progress</span>
            <span className="text-indigo-400 text-3xl font-black">68%</span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-3 p-1 border border-white/5">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-full shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: '68%' }}></div>
          </div>
        </div>
      </WidgetCard>
      <WidgetCard title="Data Hub" icon={BarChart2} onClick={() => pushPage('data', 'Analytical Core', BarChart2)}>
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="bg-black/30 p-6 rounded-[2rem] border border-white/5 text-center hover:border-indigo-500/20 transition-all">
            <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest mb-2">Network Load</p>
            <p className="text-2xl font-black text-white uppercase tracking-tighter">14<span className="text-[10px] text-slate-600 ml-1 font-normal">ms</span></p>
          </div>
          <div className="bg-black/30 p-6 rounded-[2rem] border border-white/5 text-center hover:border-indigo-500/20 transition-all">
            <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest mb-2">Active Node</p>
            <p className="text-2xl font-black text-white uppercase tracking-tighter">07<span className="text-[10px] text-slate-600 ml-1 font-normal">pts</span></p>
          </div>
        </div>
      </WidgetCard>
      <WidgetCard title="System" icon={Server} onClick={() => pushPage('settings', 'System Config', Settings)}>
        <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5"><Database size={24} /></div>
             <div><p className="text-sm font-black text-slate-200 uppercase">Cloudflare Edge</p><p className="text-[9px] text-slate-600 font-mono font-bold uppercase tracking-widest">Connected via D1</p></div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </WidgetCard>
    </div>
  );
};

const SubPage = ({ id, title, icon: Icon }) => {
  const { pushPage } = useContext(AppContext);
  return (
    <div className="h-full min-h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[4rem] bg-black/10 animate-in slide-in-from-bottom-4 fade-in duration-700">
      <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-8 shadow-2xl shadow-indigo-500/10 group">
        <Icon size={48} className="group-hover:scale-110 transition-transform duration-500" />
      </div>
      <h2 className="text-5xl font-black text-white mb-4 uppercase tracking-tighter italic">{title}</h2>
      <p className="text-slate-500 mb-10 max-w-sm text-center text-[11px] font-black uppercase tracking-[0.3em] leading-relaxed opacity-60">Interactive Workspace <br/> Layer: {id.toUpperCase()}</p>
      <div className="flex flex-wrap justify-center gap-4">
        <button onClick={() => pushPage(`${id}-detail`, `${title} Details`, Layers)} className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[1.5rem] transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl">Explore Deeper</button>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { currentPage } = useContext(AppContext);
  return (
    <Layout>
      {currentPage.id === 'home' ? <Dashboard /> : <SubPage id={currentPage.id} title={currentPage.title} icon={currentPage.icon} />}
    </Layout>
  );
};

export default function App() {
  return <AppProvider><AppContent /></AppProvider>;
}
