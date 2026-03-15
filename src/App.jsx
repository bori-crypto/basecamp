import React, { useState, createContext, useContext, useMemo, useEffect } from 'react';
import { 
  Activity, Map as MapIcon, BarChart2, 
  Shield, ShieldOff, ChevronRight, 
  Settings, Database, Server, Clock,
  ChevronLeft, Home, Layers, Sun, CloudRain, Wind, 
  Calendar, CheckCircle2, TrendingUp, DollarSign, 
  Cloud, ArrowUpRight, ArrowDownRight, Lock
} from 'lucide-react';

const AppContext = createContext();

// --- [컴포넌트 1] Regiona (대시보드 위젯) ---
const Regiona = ({ data }) => {
  const weather = data?.weather || { temp: "--", wind: "--", windDir: "--" };
  const stock = data?.stock || { index: "----.--", change: "--", percent: "--" };
  
  // 하이브리드 데이터 처리: 배열이면 length, 객체면 count 사용
  const todos = data?.todo;
  const remainingTodos = Array.isArray(todos) ? todos.length : (todos?.count || 0);

  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-2 font-sans text-slate-200 overflow-hidden">
      <section className="rounded-3xl bg-slate-800/40 border border-white/10 p-3 md:p-5 flex flex-col justify-between shadow-xl backdrop-blur-md overflow-hidden">
        <div className="flex justify-between items-center gap-1">
          <div className="flex items-center gap-1 md:gap-2">
            <Sun className="text-yellow-400 w-5 h-5 md:w-8 md:h-8 shrink-0" />
            <span className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-none">{weather.temp}°</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 text-blue-300 min-w-0 font-bold">
            <Wind className="w-5 h-5 md:w-8 md:h-8 shrink-0" />
            <span>{weather.wind}m/s</span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-slate-800/40 border border-white/10 p-3 md:p-5 shadow-xl backdrop-blur-md flex flex-col justify-center gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <Calendar className="text-blue-400 shrink-0 w-5 h-5 md:w-7 md:h-7" />
          <span className="text-base sm:text-lg font-black text-white whitespace-nowrap truncate">
            {new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-blue-300 bg-blue-500/10 w-fit px-3 py-1 rounded-lg border border-blue-500/20">
          <CheckCircle2 size={14} />
          <span className="text-[10px] md:text-sm font-bold">{remainingTodos}개 일정</span>
        </div>
      </section>

      <section className="rounded-3xl bg-slate-800/40 border border-white/10 p-3 md:p-5 flex flex-col justify-between shadow-xl backdrop-blur-md">
        <p className="text-slate-400 text-[7px] md:text-xs font-bold uppercase">KOSPI</p>
        <h3 className="text-lg md:text-2xl font-black text-white leading-none">{stock.index}</h3>
      </section>

      <section className="rounded-3xl bg-slate-800/40 border border-white/10 p-3 md:p-5 flex flex-col justify-between shadow-xl backdrop-blur-md">
        <p className="text-slate-400 text-[7px] md:text-xs font-bold uppercase">USD/KRW</p>
        <h3 className="text-lg md:text-2xl font-black text-white leading-none">1,342.5</h3>
      </section>
    </div>
  );
};

// --- [컴포넌트 2] CalendarDetail (상세 일정 페이지) ---
const CalendarDetail = ({ data }) => {
  const todos = Array.isArray(data?.todo) ? data.todo : [];
  
  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-10">
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">SCHEDULE</h1>
        <p className="text-slate-400 font-bold uppercase tracking-[0.3em]">Secure Node Data</p>
      </div>
      
      <div className="space-y-4">
        {todos.length > 0 ? todos.map((item, idx) => (
          <div key={idx} className="bg-slate-800/40 border border-white/10 p-6 rounded-[2rem] flex items-center justify-between hover:border-indigo-500/50 transition-all">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center text-indigo-400 font-black">
                <span className="text-xs uppercase leading-none mb-1">DATE</span>
                <span className="text-xl leading-none">{item.date.split('.')[1]}</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-white mb-1">{item.text}</h3>
                <span className="text-sm text-slate-500 font-bold uppercase tracking-widest">Confirmed Event</span>
              </div>
            </div>
            <ArrowUpRight className="text-slate-600" />
          </div>
        )) : (
          <div className="text-center py-20 bg-slate-800/20 rounded-[3rem] border border-dashed border-white/10">
            <p className="text-slate-500 font-bold">일정 데이터가 없거나 접근 권한이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- [컴포넌트 3] AppProvider (인증 및 데이터 로직) ---
const AppProvider = ({ children }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [history, setHistory] = useState([{ id: 'home', title: 'Dashboard', icon: Home }]);
  const [realTimeData, setRealTimeData] = useState(null);

  const WORKER_URL = 'https://sparkling-credit-38ce.borimundi.workers.dev';

  const fetchDashboardData = async (password = "") => {
    try {
      const headers = { "Content-Type": "application/json" };
      if (password) headers["X-Admin-Password"] = password;

      const response = await fetch(WORKER_URL, { headers });
      const json = await response.json();
      setRealTimeData(json);
      
      // 데이터 결과에 따른 모드 강제 전환 (검증)
      if (password && Array.isArray(json.todo)) {
        setIsPrivateMode(true);
        setAdminPassword(password);
      } else if (!password) {
        setIsPrivateMode(false);
        setAdminPassword("");
      }
    } catch (e) {
      console.error("Data Fetch Error:", e);
    }
  };

  const togglePrivateMode = () => {
    if (!isPrivateMode) {
      const input = prompt("ADMIN_SECURE 암호를 입력하세요:");
      if (input) fetchDashboardData(input);
    } else {
      fetchDashboardData(""); // 암호 없이 재요청하여 GUEST 모드 전환
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

// --- [컴포넌트 4] 메인 레이아웃 및 내비게이션 ---
const Breadcrumbs = () => {
  const { history, jumpTo, popPage } = useContext(AppContext);
  if (history.length <= 1) return null;
  return (
    <div className="flex items-center space-x-2 mb-8 px-2 animate-in fade-in slide-in-from-left-4">
      <button onClick={popPage} className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-300 transition-colors">
        <ChevronLeft size={20} />
      </button>
      <div className="flex items-center space-x-1 bg-slate-800/40 px-5 py-2.5 rounded-2xl border border-white/15 font-black text-[10px] tracking-widest text-slate-300 uppercase">
        {history.map((step, idx) => (
          <React.Fragment key={step.id}>
            <span onClick={() => jumpTo(idx)} className={`cursor-pointer hover:text-white transition-colors ${idx === history.length - 1 ? 'text-indigo-400' : ''}`}>
              {step.title}
            </span>
            {idx < history.length - 1 && <span className="text-slate-600 mx-1">/</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  const { isPrivateMode, togglePrivateMode } = useContext(AppContext);
  return (
    <div className="min-h-screen w-full bg-[#0a0f1d] text-slate-50 flex flex-col">
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={togglePrivateMode} 
          className={`px-5 py-2.5 rounded-full text-[10px] font-black tracking-widest border backdrop-blur-xl transition-all ${
            isPrivateMode 
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
            : 'bg-slate-800/40 text-slate-400 border-white/10'
          }`}
        >
          {isPrivateMode ? '● ADMIN_SECURE' : '○ GUEST_ACCESS'}
        </button>
      </div>
      <main className="flex-1 p-6 lg:p-12">
        <div className="max-w-[1600px] mx-auto pt-6">
          <Breadcrumbs />
          {children}
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => {
  const { pushPage, realTimeData } = useContext(AppContext);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
      <div onClick={() => pushPage('region-a', 'Schedules', Layers)} className="cursor-pointer group">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-[3rem] p-8 lg:p-12 hover:border-indigo-400/50 transition-all h-[400px]">
          <Regiona data={realTimeData} />
        </div>
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-slate-800/40 border border-white/10 rounded-[3rem] p-12 flex flex-col items-center justify-center opacity-40">
          <Database size={40} className="mb-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Encrypted Node {i}</span>
        </div>
      ))}
    </div>
  );
};

const AppContent = () => {
  const { currentPage, realTimeData } = useContext(AppContext);
  
  if (currentPage.id === 'region-a') {
    // 실시간 데이터가 배열 형태(인증 성공)인지 확인
    const isAdminAuthenticated = Array.isArray(realTimeData?.todo);

    if (!isAdminAuthenticated) {
      return (
        <div className="flex flex-col items-center justify-center py-40 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-400">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">Access Restricted</h2>
          <p className="text-slate-500 font-bold">상세 일정을 열람하려면 ADMIN 모드 인증이 필요합니다.</p>
        </div>
      );
    }
    return <CalendarDetail data={realTimeData} />;
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
