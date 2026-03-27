import React, { useState, useEffect, createContext } from 'react';
import Regiona from './Regiona';
import RegionB from './RegionB/index';
// ✅ 지도를 전체 화면으로 띄우기 위해 컴포넌트 임포트
import { BikeRouteFullMapView } from './RegionB/Bike';

export const AppContext = createContext();

export default function App() {
  const [page, setPage] = useState(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageIcon, setPageIcon] = useState(null);

  // 전역 사령부: 상세 페이지 띄우기 무전기
  const pushPage = (id, title, icon) => {
    setPage(id);
    setPageTitle(title);
    setPageIcon(icon);
  };

  // 전역 사령부: 뒤로가기 무전기
  const popPage = () => {
    setPage(null);
  };

  const contextValue = {
    RUNNING_WORKER_URL: "https://basecamp-run-log.borimundi.workers.dev",
    adminPassword: "8698",
    pushPage,
    popPage
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-[#0a0f1d] text-slate-200 font-sans p-4 lg:p-8 overflow-hidden flex flex-col items-center justify-center">
        
        {/* 베이스캠프 컨테이너 */}
        <div className="w-full max-w-[1400px] h-[90vh] bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-white/5 shadow-2xl relative flex flex-col overflow-hidden">
          
          {/* 상단 통합 헤더 */}
          <div className="p-6 lg:p-8 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20 italic">B</div>
              <h1 className="text-xl font-black tracking-tighter uppercase">Basecamp <span className="text-indigo-400 font-light tracking-widest text-xs ml-1 opacity-60">Commander</span></h1>
            </div>
            
            {page && (
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                Dashboard <span className="opacity-30">/</span> {pageTitle}
              </div>
            )}
          </div>

          {/* 메인 캔버스 영역 */}
          <div className="flex-1 relative overflow-hidden">
            {!page ? (
              /* 🏠 대시보드 메인 레이아웃 (Regiona + RegionB) */
              <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 lg:p-8">
                <div className="lg:col-span-5 h-full overflow-hidden">
                  <Regiona />
                </div>
                <div className="lg:col-span-7 h-full bg-slate-800/20 rounded-[2.5rem] border border-white/5 overflow-hidden">
                  <RegionB isAdmin={true} />
                </div>
              </div>
            ) : (
              /* 🗺️ 독립된 상세 화면 (오빠가 원했던 넓은 공간!) */
              <div className="h-full p-6 lg:p-8 animate-in zoom-in-95 duration-500 flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={popPage} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-xs font-bold uppercase tracking-widest">Back</button>
                  <h2 className="text-3xl font-black tracking-tighter uppercase">{pageTitle}</h2>
                </div>
                
                <div className="flex-1 rounded-[3rem] overflow-hidden border border-white/5 shadow-inner">
                  {/* ✅ Bike Travel 지도를 넓은 영역에 렌더링! */}
                  {page === 'bike-map' ? (
                    <BikeRouteFullMapView title={pageTitle} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-950/20">
                      <p className="text-slate-500 font-bold uppercase tracking-[0.5em] animate-pulse italic">Loading Content...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}
