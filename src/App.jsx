import React, { useState, createContext, useContext, useMemo, useEffect } from 'react';
import { 
  Activity, Map as MapIcon, BarChart2, 
  Shield, ShieldOff, ChevronRight, 
  Settings, Database, Server, Clock,
  ChevronLeft, Home, Layers, Lock
} from 'lucide-react';

// [중요] 깃허브에 저장된 Regiona.jsx 파일을 불러오는 코드
import Regiona from './Regiona';

const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [history, setHistory] = useState([{ id: 'home', title: 'Dashboard', icon: Home }]);
  const [realTimeData, setRealTimeData] = useState(null);

  const WORKER_URL = 'https://sparkling-credit-38ce.borimundi.workers.dev';

  // --- 데이터 호출 함수 (보안 및 피드백 강화) ---
  const fetchDashboardData = async (password = adminPassword) => {
    try {
      const headers = { "Content-Type": "application/json" };
      if (password) headers["X-Admin-Password"] = password;

      const response = await fetch(WORKER_URL, { headers });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('암호가 올바르지 않습니다.');
        }
        throw new Error('서버 통신에 실패했습니다.');
      }

      const json = await response.json();
      setRealTimeData(json);

      // 데이터 구조를 통한 인증 최종 확인
      if (password) {
        if (Array.isArray(json.todo)) {
          setIsPrivateMode(true);
          setAdminPassword(password);
        } else {
          // 암호를 넣었음에도 객체(count)가 왔다면 인증 실패로 간주
          setIsPrivateMode(false);
          setAdminPassword("");
          alert("인증에 실패했습니다. 암호를 다시 확인해 주세요.");
        }
      } else {
        setIsPrivateMode(false);
        setAdminPassword("");
      }
    } catch (error) {
      console.error("Data Fetch Error:", error);
      // 에러 발생 시 상태 초기화
      setIsPrivateMode(false);
      setAdminPassword("");
      if (password) alert(error.message);
    }
  };

  const togglePrivateMode = () => {
    if (!isPrivateMode) {
      const input = prompt("ADMIN_SECURE 암호를 입력하세요:");
      if (input) {
        fetchDashboardData(input);
      }
    } else {
      // 로그아웃 시 빈 값으로 요청하여 게스트 모드 전환
      fetchDashboardData("");
    }
  };

  const pushPage = (id, title, icon) => setHistory(prev => [...prev, { id, title, icon }]);
  const popPage = () => history.length > 1 && setHistory(prev => prev.slice(0, -1));
  const jumpTo = (index) => setHistory(prev => prev.slice(0, index + 1));
  const currentPage = useMemo(() => history[history.length - 1], [history]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(adminPassword), 600000);
    return () => clearInterval(interval);
  }, [adminPassword]);

  return (
    <AppContext.Provider value={{ 
      isPrivateMode, togglePrivateMode, history, currentPage, 
      pushPage, popPage, jumpTo, realTimeData 
    }}>
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
  const { isPrivateMode, togglePrivateMode } = useContext(AppContext);
  return (
    <div className="fixed inset-0 w-full bg-[#0a0f1d] text-slate-50 font-sans flex flex-col overflow-hidden">
      <div className="fixed top-4 right-6 z-50 pt-[env(safe-area-inset-top)]">
        <button onClick={togglePrivateMode} className={`px-4 py-2 rounded-full text-[10px] font-black tracking-[0.15em] border backdrop-blur-xl ${isPrivateMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800/40 text-slate-400 border-white/10'}`}>
          {isPrivateMode ? 'ADMIN_SECURE' : 'GUEST_ACCESS'}
        </button>
      </div>
      <main className="flex-1 overflow-y-auto p-4 lg:p-10 w-full pb-[env(safe-area-inset-bottom)]">
        <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col pt-6">
          <Breadcrumbs />
          <div className="flex-1 w-full">{children}</div>
        </div>
      </main>
    </div>
  );
};

const WidgetCard = ({ children, onClick }) => (
  <div 
    onClick={onClick} 
    style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }} 
    className="backdrop-blur-2xl border border-white/10 rounded-[2rem] lg:rounded-[3rem] p-5 lg:p-14 hover:border-indigo-400/40 transition-all cursor-pointer group flex flex-col h-full min-h-[240px] lg:min-h-[420px] w-full touch-manipulation"
  >
    <div className="flex-1 flex flex-col justify-center w-full">{children}</div>
  </div>
);

const Dashboard = () => {
  const { pushPage, realTimeData } = useContext(AppContext);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-12 py-2 w-full max-w-full">
      <WidgetCard onClick={() => pushPage('region-a', 'Schedules', Layers)}>
        <Regiona data={realTimeData} />
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

const AppContent = () => {
  const { currentPage, realTimeData } = useContext(AppContext);

  if (currentPage.id === 'region-a') {
    const isAdminAuthenticated = Array.isArray(realTimeData?.todo);

    if (!isAdminAuthenticated) {
      return (
        <div className="flex flex-col items-center justify-center py-40 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-400">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">Access Restricted</h2>
          <p className="text-slate-500 font-bold text-sm">상세 일정을 보려면 ADMIN 모드로 인증하세요.</p>
        </div>
      );
    }
    return <div className="text-white p-10 font-black text-4xl">{currentPage.title} Page Ready</div>;
  }

  return currentPage.id === 'home' ? <Dashboard /> : <div className="text-center py-20 text-3xl font-black">{currentPage.title}</div>;
};

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <AppContent />
      </Layout>
    </AppProvider>
  );
}
