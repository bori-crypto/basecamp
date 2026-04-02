import React, { useState, createContext, useContext, useMemo, useEffect } from 'react';
import {
  Camera, Map as MapIcon, BarChart2,
  Shield, ShieldOff, ChevronRight,
  Settings, Database, Server, Clock,
  ChevronLeft, Home, Layers, Lock, CloudSun, TrendingUp, DollarSign, Key
} from 'lucide-react';

import Regiona from './Regiona';
import RegionB from './RegionB/index';
// ✅ 3단계 지도 컴포넌트 임포트
import { BikeRouteFullMapView } from './RegionB/Bike';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [history, setHistory] = useState([{ id: 'home', title: 'Dashboard', icon: Home }]);
  const [realTimeData, setRealTimeData] = useState(null);

  // ✅ B구역 메모리 공급용 상태
  const [regionBState, setRegionBState] = useState({ step: 0, path: [], selectedCategory: null });

  // ✅ 커스텀 로그인 모달 상태 추가 (prompt 대체)
  const [showLoginModal, setShowLoginModal] = useState(false);

  const WORKER_URL = 'https://sparkling-credit-38ce.borimundi.workers.dev';
  const RUNNING_WORKER_URL = 'https://basecamp-run-bridge.borimundi.workers.dev';
  const BIKE_WORKER_URL = 'https://basecamp-bike-api.borimundi.workers.dev';

  // ✅ 한 번만 로그인되도록 인증 로직 수정
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
          setShowLoginModal(false); // 로그인 성공 시 모달 닫기
          return true; // 성공 반환
        } else {
          throw new Error('인증에 실패했습니다. 암호를 다시 확인해 주세요.');
        }
      } else {
        setIsPrivateMode(false);
        setAdminPassword("");
        return true;
      }
    } catch (error) {
      console.error("Data Fetch Error:", error);
      setIsPrivateMode(false);
      setAdminPassword("");
      if (password) alert(error.message);
      return false; // 실패 반환
    }
  };

  const togglePrivateMode = () => {
    if (!isPrivateMode) {
      setShowLoginModal(true); // prompt 대신 모달 띄우기
    } else {
      fetchDashboardData(""); // 로그아웃 처리
    }
  };

  const pushPage = (id, title, icon, customPath = []) => setHistory(prev => [...prev, { id, title, icon, customPath }]);
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
      pushPage, popPage, jumpTo, realTimeData,
      adminPassword, RUNNING_WORKER_URL,
      BIKE_WORKER_URL,
      regionBState, setRegionBState
    }}>
      {children}
      
      {/* ✅ 커스텀 로그인 모달 추가 (한/영 픽스 및 보안 강화) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-2xl w-80 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 justify-center mb-2">
              <div className="p-3 bg-indigo-500/20 rounded-full text-indigo-400">
                <Key size={24} />
              </div>
              <h3 className="text-lg font-black text-white tracking-widest">ADMIN_SECURE</h3>
            </div>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const pwd = e.target.password.value;
                if (!pwd) return;
                const success = await fetchDashboardData(pwd);
                if (success) setShowLoginModal(false);
              }}
              className="flex flex-col gap-4"
            >
              <input
                name="password"
                type="password"
                autoFocus
                autoComplete="off" // 자동완성 방지
                style={{ imeMode: 'disabled' }} // 🚨 핵심: 한글 입력기 강제 차단 (영문 고정)
                placeholder="Password"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-center text-white tracking-widest focus:border-indigo-500/50 outline-none transition-colors"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-400 hover:bg-white/5 transition-colors">취소</button>
                <button type="submit" className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 transition-colors">접속</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
  const { isPrivateMode, togglePrivateMode, currentPage } = useContext(AppContext);

  return (
    <div className="min-h-screen p-4 flex flex-col bg-base-bg text-white">
      <header className="flex justify-end items-center mb-6">
        <button 
          onClick={togglePrivateMode} 
          className={`px-4 py-2 rounded-full text-[10px] font-black tracking-[0.15em] border backdrop-blur-xl transition-all shadow-lg ${isPrivateMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-slate-800/40 text-slate-400 border-white/10 hover:bg-white/10'}`}
        >
          {isPrivateMode ? 'ADMIN_SECURE' : 'GUEST_ACCESS'}
        </button>
      </header>
      
      {currentPage.id !== 'bike-map' && <Breadcrumbs />}
      
      <div className="flex-1 flex flex-col w-full h-full">
        {children}
      </div>
    </div>
  );
};

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
      <WidgetCard noPadding={true}>
        <Regiona data={realTimeData} />
      </WidgetCard>
      <WidgetCard noPadding={true}>
        <RegionB isAdmin={isPrivateMode} />
      </WidgetCard>
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
  const { currentPage, realTimeData, popPage, setRegionBState } = useContext(AppContext);

  if (currentPage.id === 'schedules-detail') {
    const isAdminAuthenticated = Array.isArray(realTimeData?.todo);
    if (!isAdminAuthenticated) {
      return <div className="p-10 text-center text-red-400">접근 권한이 없습니다.</div>;
    }
  }

  return (
    <Layout>
      {currentPage.id === 'home' ? <Dashboard /> : (
        <>
          {currentPage.id === 'bike-map' ? (
            <div className="flex flex-col flex-1 w-full animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-3 mb-4 shrink-0">
                <button 
                  onClick={() => {
                    if (currentPage.customPath && currentPage.customPath.length > 0) {
                      setRegionBState(prev => ({
                        ...prev,
                        step: currentPage.customPath.length - 1,
                        path: currentPage.customPath.slice(0, -1)
                      }));
                    }
                    popPage();
                  }} 
                  className="group flex items-center gap-2 bg-[#1e293b] hover:bg-[#334155] border border-white/5 px-4 py-2 rounded-2xl transition-all text-[13px] font-medium text-white shadow-lg"
                >
                  <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  뒤로가기
                </button>
                <div className="flex items-center gap-2 text-[13px] text-slate-400 font-medium flex-wrap bg-[#0f172a]/60 px-4 py-2 rounded-2xl border border-white/5 shadow-lg">
                  <button 
                    onClick={() => {
                      setRegionBState({ step: 0, path: [], selectedCategory: null });
                      popPage();
                    }} 
                    className="hover:text-indigo-400 transition-colors uppercase tracking-wider"
                  >
                    유니버스
                  </button>
                  {currentPage.customPath && currentPage.customPath.map((p, i) => (
                    <React.Fragment key={i}>
                      <span className="text-white/20 select-none">{'>'}</span>
                      <button
                        onClick={() => { 
                          if (i < currentPage.customPath.length - 1) {
                            setRegionBState(prev => ({
                              ...prev,
                              step: i + 1,
                              path: currentPage.customPath.slice(0, i + 1)
                            }));
                            popPage();
                          }
                        }}
                        className={`transition-colors whitespace-pre ${i === currentPage.customPath.length - 1 ? "text-slate-100 font-bold cursor-default" : "hover:text-slate-300 cursor-pointer"}`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex-1 w-full relative rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl min-h-[500px]">
                <div className="absolute inset-0">
                  <BikeRouteFullMapView title={currentPage.title} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-6 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-md">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                {currentPage.icon && <currentPage.icon className="text-indigo-400" />}
                {currentPage.title}
              </h2>
              <p className="text-slate-400 mt-4">세부 콘텐츠 구현 준비 중...</p>
            </div>
          )}
        </>
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
