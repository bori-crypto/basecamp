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
  
  // 🧹 찌꺼기 제거: RUNNING_WORKER_URL 삭제 완료

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
    // 🧹 찌꺼기 제거 및 복원: RUNNING_WORKER_URL 대신 원래 쓰던 WORKER_URL을 내보냄 (RegionB에서 사용)
    <AppContext.Provider value={{
      isPrivateMode, togglePrivateMode, history, currentPage,
      pushPage, popPage, jumpTo, realTimeData,
      adminPassword, WORKER_URL 
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
          {idx < history.length - 1 && <span className="text-slate-500"> / </span>}
        </React.Fragment>
      ))}
    </div>
  );
};

const Layout = ({ children }) => {
  const { isPrivateMode, togglePrivateMode } = useContext(AppContext);
  return (
    <div className="min-h-screen bg-slate-950 p-4 lg:p-8 flex flex-col items-center w-full">
      <div className="w-full max-w-7xl flex justify-between items-center mb-6">
        <h1 className="text-xl font-black text-white">Basecamp</h1>
        <button
          onClick={togglePrivateMode}
          className={`px-4 py-2 rounded-full text-[10px] font-black tracking-[0.15em] border backdrop-blur-xl ${isPrivateMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800/40 text-slate-400 border-white/10'}`}
        >
          {isPrivateMode ? 'ADMIN_SECURE' : 'GUEST_ACCESS'}
        </button>
      </div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
      {/* RegionA (좌상단) */}
      <WidgetCard noPadding>
        <Regiona isAdmin={isPrivateMode} data={realTimeData?.todo} />
      </WidgetCard>
      {/* RegionB: Roadmap (우상단) */}
      <WidgetCard noPadding>
        <RegionB isAdmin={isPrivateMode} data={realTimeData} />
      </WidgetCard>
      {/* 하단 위젯들 */}
      <div className="flex flex-col gap-6">
        <WidgetCard onClick={() => pushPage('storage', 'Database', Database)}>
          <div className="flex items-center gap-2 text-white font-bold"><Database size={20}/> Database</div>
        </WidgetCard>
        <WidgetCard onClick={() => pushPage('network', 'Network', Server)}>
          <div className="flex items-center gap-2 text-white font-bold"><Server size={20}/> Network</div>
        </WidgetCard>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { currentPage, realTimeData } = useContext(AppContext);

  if (currentPage.id === 'schedules-detail') {
    const isAdminAuthenticated = Array.isArray(realTimeData?.todo);
    if (!isAdminAuthenticated) {
      return <div className="text-center text-slate-400 mt-20">접근 권한이 없습니다.</div>;
    }
  }

  return (
    <Layout>
      <Breadcrumbs />
      {currentPage.id === 'home' ? <Dashboard /> : (
        <div className="w-full max-w-7xl">
          <div className="flex items-center gap-3 mb-6">
            <currentPage.icon className="text-indigo-400" size={32} />
            <h2 className="text-2xl font-black text-white">{currentPage.title}</h2>
          </div>
          <div className="text-slate-500 italic">세부 화면 준비 중...</div>
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
