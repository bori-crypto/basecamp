import React, { useState, useEffect, createContext } from 'react';
import { ChevronLeft } from 'lucide-react';
import Regiona from './Regiona';
import RegionB from './RegionB/index';
import { BikeRouteFullMapView } from './RegionB/Bike';

export const AppContext = createContext();

export default function App() {
  const [page, setPage] = useState(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageIcon, setPageIcon] = useState(null);
  const [pagePath, setPagePath] = useState([]); 

  const pushPage = (id, title, icon, customPath = []) => {
    setPage(id);
    setPageTitle(title);
    setPageIcon(icon);
    setPagePath(customPath);
  };

  const popPage = () => {
    setPage(null);
    setPagePath([]);
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
        
        {/* 베이스캠프 메인 컨테이너 (상단 헤더 삭제 및 원상복구) */}
        <div className="w-full max-w-[1400px] h-[90vh] bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-white/5 shadow-2xl relative flex flex-col overflow-hidden">
          
          {/* 메인 캔버스 영역 */}
          <div className="flex-1 relative overflow-hidden">
            {!page ? (
              /* 🏠 대시보드 메인 레이아웃 (Regiona + RegionB 2x2 구성 유지) */
              <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 lg:p-8">
                <div className="lg:col-span-5 h-full overflow-hidden">
                  <Regiona />
                </div>
                <div className="lg:col-span-7 h-full bg-slate-800/20 rounded-[2.5rem] border border-white/5 overflow-hidden">
                  <RegionB isAdmin={true} />
                </div>
              </div>
            ) : (
              /* 🗺️ 독립된 상세 화면 (오빠가 원했던 넓은 공간) */
              <div className="h-full p-4 lg:p-6 animate-in zoom-in-95 duration-500 flex flex-col">
                
                {/* 2단계 네비게이션 크기 및 위치 이식 (기존 캡처/거창한 타이틀 삭제) */}
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={popPage} className="group flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all text-xs font-medium border border-white/10 text-white shadow-lg">
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    뒤로가기
                  </button>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium flex-wrap bg-slate-900/40 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/5">
                    <button onClick={popPage} className="hover:text-indigo-400 transition-colors uppercase tracking-wider">유니버스</button>
                    {pagePath.map((p, i) => (
                      <React.Fragment key={i}>
                        <span className="text-white/20 select-none">{'>'}</span>
                        <button
                          onClick={popPage}
                          className={`transition-colors whitespace-pre ${i === pagePath.length - 1 ? "text-slate-100 font-bold cursor-default" : "hover:text-slate-300 cursor-pointer"}`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                
                {/* 하단 넓은 구역에 지도 렌더링 */}
                <div className="flex-1 rounded-[3rem] overflow-hidden border border-white/5">
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
