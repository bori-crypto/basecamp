import React, { useState, createContext, useContext, useMemo } from 'react';
import { 
  Activity, Map as MapIcon, BarChart2, 
  Shield, ShieldOff, ChevronRight, 
  Settings, Database, Server, Clock,
  ChevronLeft, Home, Layers
} from 'lucide-react';

// [중요] 깃허브에 저장된 Regiona.jsx 파일을 불러오는 코드
import Regiona from './Regiona';

const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [history, setHistory] = useState([{ id: 'home', title: 'Dashboard', icon: Home }]);

  const togglePrivateMode = () => setIsPrivateMode(!isPrivateMode);
  const pushPage = (id, title, icon) => setHistory(prev => [...prev, { id, title, icon }]);
  const popPage = () => history.length > 1 && setHistory(prev => prev.slice(0, -1));
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
    <div className="flex items-center space-x-2 mb-8 animate-in fade-in slide-in-from-left-4 px-2">
      <button onClick={popPage} className="mr-2 p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10">
        <ChevronLeft size={20} />
      </button>
      <div className="flex items-center space-x-1 bg-slate-800/40 px-5 py-2.5 rounded-[1.25rem] border border-white/15">
        {history.map((step, idx) => (
          <React.Fragment key={step.id}>
            <button onClick={() => jumpTo(idx)} className={`text-[10px] font-black uppercase tracking-[0.2em] ${idx === history.length - 1 ? 'text-indigo-400' : 'text-slate-300'}`}>
              <span>{step.title}</span>
            </button>
            {idx < history.length - 1 && <span className="text-slate-600 px-1">/</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  const { isPrivateMode, togglePrivateMode, pushPage } = useContext(AppContext);
  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-50 font-sans flex flex-col">
      <div className="fixed top-4 right-6 z-50">
        <button onClick={togglePrivateMode} className={`px-4 py-2 rounded-full text-[10px] font-black tracking-[0.15em] border backdrop-blur-xl ${isPrivateMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800/40 text-slate-400 border-white/10'}`}>
          {isPrivateMode ? 'ADMIN_SECURE' : 'GUEST_ACCESS'}
        </button>
      </div>
      <main className="flex-1 overflow-y-auto p-4 lg:p-10">
        <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col pt-6">
          <Breadcrumbs />
          <div className="flex-1">{children}</div>
        </div>
      </main>
    </div>
  );
};

const WidgetCard = ({ children, onClick }) => (
  <div onClick={onClick} style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }} className="backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 lg:p-14 hover:border-indigo-400/40 transition-all cursor-pointer group flex flex-col h-full min-h-[360px]">
    <div className="flex-1 flex flex-col justify-center">{children}</div>
  </div>
);

const Dashboard = () => {
  const { pushPage } = useContext(AppContext);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 py-2">
      {/* [여기가 좌상단 2*2 장소] - 불러온 Regiona를 꽂음 */}
      <WidgetCard onClick={() => pushPage('region-a', 'Region Alpha', Layers)}>
        <Regiona />
      </WidgetCard>

      <WidgetCard onClick={() => pushPage('analytics', 'Analytics', BarChart2)}>
        <div className="flex flex-col items-center text-slate-500">
           <BarChart2 size={40} className="mb-4 opacity-20" />
           <span className="text-[10px] font-black tracking-[0.2em] uppercase">Analytics Node</span>
        </div>
      </WidgetCard>

      <WidgetCard onClick={() => pushPage('storage', 'Database', Database)}>
        <div className="flex flex-col items-center text-slate-500">
           <Database size={40} className="mb-4 opacity-20" />
           <span className="text-[10px] font-black tracking-[0.2em] uppercase">Storage Cluster</span>
        </div>
      </WidgetCard>

      <WidgetCard onClick={() => pushPage('network', 'Network', Server)}>
        <div className="flex flex-col items-center text-slate-500">
           <Server size={40} className="mb-4 opacity-20" />
           <span className="text-[10px] font-black tracking-[0.2em] uppercase">Edge Server</span>
        </div>
      </WidgetCard>
    </div>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState({ id: 'home' }); // 실제 앱에선 Context 사용

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

const AppContent = () => {
  const { currentPage } = useContext(AppContext);
  return (
    <Layout>
      {currentPage.id === 'home' ? <Dashboard /> : <div className="text-center py-20 text-3xl font-black">{currentPage.title}</div>}
    </Layout>
  );
};
