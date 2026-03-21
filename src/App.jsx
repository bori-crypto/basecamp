import React, { useState, createContext, useContext, useMemo, useEffect } from 'react';
import {
  Camera, Map as MapIcon, BarChart2,
  Shield, ShieldOff, ChevronRight,
  Settings, Database, Server, Clock,
  ChevronLeft, Home, Layers, Lock, CloudSun, TrendingUp, DollarSign
} from 'lucide-react';

import Regiona from './Regiona';
import RegionB from './RegionB';

// Context 생성
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [history, setHistory] = useState([{ id: 'home', title: 'Dashboard', icon: Home }]);
  const [realTimeData, setRealTimeData] = useState(null);

  const WORKER_URL = 'https://sparkling-credit-38ce.borimundi.workers.dev';
  // ✅ 추가: 러닝 로그 전용 워커 URL
  const RUNNING_WORKER_URL = 'https://basecamp-run-bridge.borimundi.workers.dev';

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

      if (password) {
        if (Array.isArray(json.todo)) {
          setIsPrivateMode(true);
          setAdminPassword(password);
        } else {
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
    // ✅ 수정: Provider value에 adminPassword와 RUNNING_WORKER_URL 추가
    <AppContext.Provider value={{
      isPrivateMode, togglePrivateMode, history, currentPage,
      pushPage, popPage, jumpTo, realTimeData,
      adminPassword, RUNNING_WORKER_URL
    }}>
      {children}
    </AppContext.Provider>
  );
};

const Breadcrumbs = () => {
  const { history, jumpTo } = useContext(AppContext);
  if (history.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 mb-4">
      {history.map((step, idx) => (
        <React.Fragment key={step.id}>
          <button 
            onClick={() => jumpTo(idx)} 
            className={`text-[10px] font-black uppercase tracking-[0.2em] ${idx === history.length - 1 ? 'text-indigo-400' : 'text-slate-300'}`}
          >
            {step.title}
          </button>
          {idx < history.length - 1 && <ChevronRight size={12} className="text-slate-500" />}
        </React.Fragment>
      ))}
    </div>
  );
};

const Layout = ({ children }) => {
  const { isPrivateMode, togglePrivateMode } = useContext(AppContext);

  return (
    <div className="min-h-screen p-4 flex flex-col bg-base-bg text-white">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Layers className="text-indigo-400" />
          Basecamp
        </h1>
        <button 
          onClick={togglePrivateMode} 
          className={`px-4 py-2 rounded-full text-[10px] font-black tracking-[0.15em] border backdrop-blur-xl ${isPrivateMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800/40 text-slate-400 border-white/10'}`}
        >
          {isPrivateMode ? 'ADMIN_SECURE' : 'GUEST_ACCESS'}
        </button>
      </header>
      <Breadcrumbs />
      {children}
    </div>
  );
};

// WidgetCard: 맥북 크롬 글자 잘림 방지를 위해 lg:p-14에서 lg:p-8로 여백 다이어트
const WidgetCard = ({ children, onClick, noPadding = false }) => (
  <div 
    onClick={onClick}
    style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
    className={`backdrop-blur-2xl border border-white/10 rounded-[2rem] lg:rounded-[3rem] ${noPadding ? '' : 'p-5 lg:p-8 landscape:p-4 lg:landscape:p-8'} transition-all cursor-pointer flex flex-col h-full min-h-[240px] lg:min-h-[420px] landscape:min-h-[160px] lg:landscape:min-h-[420px] w-full touch-manipulation`}
  >
    {children}
  </div>
);

const Dashboard = () => {
  const { pushPage, realTimeData, isPrivateMode } = useContext(AppContext);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
      {/* RegionA (좌상단) */}
      <WidgetCard noPadding={true}>
        <Regiona data={realTimeData} />
      </WidgetCard>

      {/* RegionB: Roadmap (우상단) */}
      <WidgetCard noPadding={true}>
        <RegionB isAdmin={isPrivateMode} />
      </WidgetCard>

      {/* 하단 위젯들 */}
      <WidgetCard onClick={() => pushPage('storage', 'Database', <Database />)}>
        <h2 className="text-lg font-bold">Storage Cluster</h2>
      </WidgetCard>

      <WidgetCard onClick={() => pushPage('network', 'Network', <Server />)}>
        <h2 className="text-lg font-bold">Edge Server</h2>
      </WidgetCard>
    </div>
  );
};

const AppContent = () => {
  const { currentPage, realTimeData } = useContext(AppContext);

  if (currentPage.id === 'schedules-detail') {
    const isAdminAuthenticated = Array.isArray(realTimeData?.todo);
    if (!isAdminAuthenticated) {
      return <div className="p-10 text-center text-red-400">접근 권한이 없습니다.</div>;
    }
  }

  return (
    <Layout>
      {currentPage.id === 'home' ? <Dashboard /> : (
        <div className="flex-1 p-6 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-md">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <currentPage.icon className="text-indigo-400" />
            {currentPage.title}
          </h2>
          <p className="text-slate-400 mt-4">세부 콘텐츠 구현 준비 중...</p>
        </div>
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
