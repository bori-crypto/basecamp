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
    <div className="flex items-center space-x-2 mb-8 animate-in fade-in slide-in-from-left-4 duration-700 px-2">
      <button onClick={popPage} className="mr-2 p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 transition-all border border-white/10 shadow-lg"><ChevronLeft size={20} /></button>
      <div className="flex items-center space-x-1 bg-slate-800/40 backdrop-blur-xl px-5 py-2.5 rounded-[1.25rem] border border-white/15 shadow-2xl">
        {history.map((step, idx) => (
          <React.Fragment key={step.id}>
            <button onClick={() => jumpTo(idx)} className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${idx === history.length - 1 ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-100'}`}>
              {step.icon && <step.icon size={12} />}<span>{step.title}</span>
            </button>
            {idx < history.length - 1 && <span className="text-slate-700 px-1 font-light opacity-50">/</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// --- Dashboard ---
const Dashboard = ({ intelData, loading, error, onRetry }) => {
  const { pushPage } = useContext(AppContext);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 py-2 animate-in fade-in zoom-in-95 duration-1000">
      
      {/* [오빠 여기!] 기존의 복잡한 글자/아이콘 다 지우고 <RegionA /> 부품만 딱 끼워 넣었어! */}
      <WidgetCard title="Trajectory" icon={Activity} onClick={() => pushPage('trajectory', 'Trajectory Hub', Activity)}>
         <RegionA 
           data={intelData} 
           loading={loading} 
           error={error} 
           onRetry={onRetry}
           onScheduleClick={(e) => {
             e.stopPropagation(); // 카드 전체 클릭과 충돌 방지
             pushPage('schedule', 'Operational Schedule', Calendar);
           }}
         />
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
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-white/5 text-center shadow-inner">
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2">Network Load</p>
            <p className="text-2xl font-black text-slate-100">14<span className="text-[10px] text-slate-500 ml-1 font-normal">ms</span></p>
          </div>
          <div className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-white/5 text-center shadow-inner">
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2">Active Node</p>
            <p className="text-2xl font-black text-slate-100">07<span className="text-[10px] text-slate-500 ml-1 font-normal">pts</span></p>
          </div>
        </div>
      </WidgetCard>

      <WidgetCard title="System" icon={Server} onClick={() => pushPage('settings', 'System Config', Settings)}>
        <div className="p-8 bg-slate-900/60 rounded-[3rem] border border-white/5 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-5">
             <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10"><Database size={24} /></div>
             <div>
               <p className="text-sm font-black text-slate-100 uppercase tracking-tight">Cloudflare Edge</p>
               <p className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest mt-1">Connected via D1</p>
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

// --- Detail & Sub Pages ---
const ScheduleDetail = ({ items }) => (
  <div className="h-full animate-in slide-in-from-right duration-500 max-w-2xl mx-auto py-10 px-4">
     <div className="flex items-center gap-6 mb-12">
        <div className="p-6 bg-indigo-500/10 rounded-[2rem] text-indigo-400 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10"><Calendar size={42} /></div>
        <div>
          <h2 className="text-4xl font-black text-slate-50 uppercase tracking-tighter italic leading-none">Operational Schedule</h2>
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.3em] mt-3 uppercase italic">Logistics Command / Real-time Sync</p>
        </div>
     </div>
     <div className="space-y-4">
       {items?.map((item) => (
         <div key={item.id} className={`p-6 rounded-[2.5rem] border transition-all flex items-center justify-between ${item.status === 'completed' ? 'bg-slate-900/30 border-white/5 opacity-40' : 'bg-slate-900/80 border-white/10 hover:border-indigo-500/40 group shadow-2xl'}`}>
           <div className="flex items-center gap-5">
             <div className={`p-3.5 rounded-2xl ${item.status === 'completed' ? 'bg-slate-800 text-slate-600' : 'bg-indigo-500/10 text-indigo-400 shadow-inner'}`}>
               {item.status === 'completed' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
             </div>
             <div>
               <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{item.category} • {item.time}</div>
               <div className={`font-black text-lg ${item.status === 'completed' ? 'text-slate-500 line-through font-medium' : 'text-slate-200'}`}>{item.title}</div>
             </div>
           </div>
         </div>
       ))}
     </div>
  </div>
);

const SubPage = ({ id, title, icon: Icon }) => (
  <div style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.7) 100%)' }} className="h-full min-h-[60vh] flex flex-col items-center justify-center border border-white/10 rounded-[4rem] backdrop-blur-3xl animate-in fade-in duration-700 shadow-2xl">
    <div className="w-28 h-28 rounded-[3rem] bg-indigo-500/10 border border-white/10 flex items-center justify-center text-indigo-400 mb-8 shadow-2xl shadow-indigo-500/10"><Icon size={56} /></div>
    <h2 className="text-5xl font-black text-slate-50 mb-4 uppercase tracking-tighter italic">{title}</h2>
    <p className="text-slate-400 mb-12 text-[11px] font-black uppercase tracking-[0.4em]">Interactive Workspace / Layer: <span className="text-indigo-400">{id}</span></p>
    <div className="w-16 h-1 bg-indigo-500/30 rounded-full animate-pulse"></div>
  </div>
);

// --- Layout & Logic ---
const Layout = ({ children }) => {
  const { isPrivateMode, togglePrivateMode, pushPage } = useContext(AppContext);
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-50 font-sans selection:bg-indigo-500/30 overflow-hidden relative flex flex-col">
      <div className="fixed top-6 right-8 z-50">
        <button onClick={togglePrivateMode} className={`flex items-center space-x-3 px-5 py-2.5 rounded-full text-[10px] font-black tracking-[0.2em] transition-all duration-500 border backdrop-blur-3xl shadow-2xl ${isPrivateMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10' : 'bg-slate-800/40 text-slate-500 border-white/5 hover:border-white/10'}`}>
          {isPrivateMode ? <Shield size={14} className="animate-pulse" /> : <ShieldOff size={14} />}
          <span>{isPrivateMode ? 'SECURE_ON' : 'GUEST_MODE'}</span>
        </button>
      </div>
      <main className="flex-1 overflow-y-auto p-4 lg:p-10">
        <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col pt-6">
          <Breadcrumbs />
          <div className="flex-1">{children}</div>
        </div>
      </main>
      <div className="fixed bottom-8 right-8 z-50 opacity-40 hover:opacity-100 transition-opacity">
        <button onClick={() => pushPage('settings', 'System Config', Settings)} className="p-4 bg-slate-900/80 rounded-full border border-white/10 text-slate-400 hover:text-indigo-400 backdrop-blur-md shadow-2xl transition-all"><Settings size={20} /></button>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { currentPage } = useContext(AppContext);
  const [intelData, setIntelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const WORKER_URL = "https://sparkling-credit-38ce.borimundi.workers.dev";

  const fetchIntel = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(WORKER_URL);
      if (!response.ok) throw new Error("Sync Fail");
      const data = await response.json();
      const mockSchedule = [
        { id: 1, time: '10:00', title: 'Region_A 시스템 동기화', category: 'SYSTEM', status: 'completed' },
        { id: 2, time: '14:30', title: '실시간 데이터 필터링 테스트', category: 'DEV', status: 'pending' },
        { id: 3, time: '16:00', title: '사령부 통합 UI 리뷰', category: 'REVIEW', status: 'pending' },
        { id: 4, time: '21:00', title: '보안 데이터 백업', category: 'SEC', status: 'pending' },
      ];
      setIntelData({ summary: data, scheduleItems: data.scheduleItems || mockSchedule });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => { fetchIntel(); }, []);

  return (
    <Layout>
      {currentPage.id === 'home' ? (
        <Dashboard intelData={intelData} loading={loading} error={error} onRetry={fetchIntel} />
      ) : currentPage.id === 'schedule' ? (
        <ScheduleDetail items={intelData?.scheduleItems} />
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

const WidgetCard = ({ title, icon: Icon, onClick, children }) => (
  <div onClick={onClick} style={{ background: 'linear-gradient(135deg, #151c2c 0%, #0a0f1d 100%)' }} className="backdrop-blur-3xl border border-white/5 rounded-[4rem] p-10 lg:p-14 hover:border-indigo-500/30 transition-all duration-700 cursor-pointer group flex flex-col h-full min-h-[420px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] active:scale-[0.98]">
    <div className="flex items-center justify-between mb-12">
      <div className="flex items-center space-x-6 text-slate-500 group-hover:text-indigo-400 transition-all duration-500 group-hover:translate-x-1">
        <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 group-hover:border-indigo-500/30 transition-all shadow-inner"><Icon size={32} /></div>
        <h3 className="font-black text-3xl lg:text-4xl tracking-tighter uppercase text-slate-100 italic">{title}</h3>
      </div>
      <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-indigo-500/20 text-slate-600 group-hover:text-indigo-300 transition-all border border-white/5 group-hover:border-indigo-500/30 shadow-xl"><ChevronRight size={32} /></div>
    </div>
    <div className="flex-1 flex flex-col justify-center">{children}</div>
  </div>
);
