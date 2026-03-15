import React, { useState } from 'react';
import { 
  Sun, CloudRain, Wind, Calendar, CheckCircle2, 
  TrendingUp, DollarSign, ChevronLeft, Cloud, 
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// --- 데이터 상수 (데이터는 오빠가 나중에 API로 바꾸기 쉽게 따로 뺐어!) ---
const WEATHER_DATA = {
  current: { temp: 12, wind: 3.2, windDir: 'NW' },
  forecast: [
    { day: 'Mon', temp: 14, icon: <Sun size={14} /> },
    { day: 'Tue', temp: 11, icon: <Cloud size={14} /> },
    { day: 'Wed', temp: 9, icon: <CloudRain size={14} /> },
  ]
};

const TODO_DATA = [
  { id: 1, text: '주간 보고서 작성', done: false, date: '03.15' },
  { id: 2, text: '신규 프로젝트 미팅', done: true, date: '03.16' },
  { id: 3, text: '건강검진 예약', done: false, date: '03.17' },
  { id: 4, text: '러닝 5km', done: false, date: '03.18' },
];

const STOCK_DATA = {
  index: "2,645.20",
  change: "+12.45",
  percent: "0.47%",
  points: [10, 25, 15, 40, 35, 60, 55, 80, 75, 90]
};

const CURRENCY_DATA = {
  rate: "1,342.50",
  change: "2.10",
};

export default function App() {
  const [isListOpen, setIsListOpen] = useState(false);
  const remainingTodos = TODO_DATA.filter(t => !t.done).length;

  return (
    /* 오빠, 여기서 grid-cols-2로 고정해서 아이폰에서도 2*2가 유지돼! */
    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-3 md:gap-4 font-sans text-slate-200">
      
      {/* 위젯 1: 날씨 */}
      <section className="rounded-[2rem] bg-slate-800/40 border border-white/10 p-4 md:p-6 flex flex-col justify-between shadow-xl backdrop-blur-md">
        <div className="flex justify-between items-center gap-2">
          {/* 온도 */}
          <div className="flex items-center gap-1 md:gap-3">
            <Sun className="text-yellow-400 w-6 h-6 md:w-9 md:h-9" />
            <span className="text-xl md:text-3xl lg:text-4xl font-black text-white">{WEATHER_DATA.current.temp}°</span>
          </div>
          {/* 바람 */}
          <div className="flex items-center gap-1 md:gap-3 text-blue-300">
            <Wind className="w-6 h-6 md:w-9 md:h-9" />
            <div className="flex flex-col items-start leading-none">
              <div className="flex items-baseline gap-0.5 md:gap-1">
                <span className="text-xl md:text-3xl lg:text-4xl font-black text-white">{WEATHER_DATA.current.wind}</span>
                <span className="text-[8px] md:text-[10px] font-medium text-slate-500 uppercase tracking-tighter">m/s</span>
              </div>
              <span className="text-[10px] md:text-xs font-bold text-blue-300/80 uppercase tracking-widest">
                {WEATHER_DATA.current.windDir}
              </span>
            </div>
          </div>
        </div>
        
        {/* 하단 예보 리스트 (모바일에서도 안 깨지게 패딩 조절) */}
        <div className="flex justify-between items-center bg-white/5 rounded-xl md:rounded-2xl p-2 md:p-4 mt-2">
          {WEATHER_DATA.forecast.map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 md:gap-1">
              <span className="text-[8px] md:text-[10px] text-slate-400 uppercase font-bold">{f.day}</span>
              <div className="scale-75 md:scale-100">{f.icon}</div>
              <span className="text-[10px] md:text-sm font-bold">{f.temp}°</span>
            </div>
          ))}
        </div>
      </section>

      {/* 위젯 2: 할 일 (날짜/요일 한 줄 배치 & 반응형 크기) */}
      <section 
        role="button"
        onClick={() => setIsListOpen(!isListOpen)}
        className="rounded-[2rem] bg-slate-800/40 border border-white/10 p-4 md:p-6 cursor-pointer hover:bg-slate-700/40 active:scale-[0.98] transition-all duration-300 shadow-xl overflow-hidden relative backdrop-blur-md"
      >
        {!isListOpen ? (
          <div className="h-full flex flex-col justify-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
              <Calendar className="text-blue-400 shrink-0 w-5 h-5 md:w-8 md:h-8" />
              {/* text-lg(모바일) -> text-3xl(태블릿) -> text-4xl(데스크탑)으로 유연하게 조절! */}
              <span className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter text-white whitespace-nowrap leading-none">
                2026.3.15. (일)
              </span>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 text-blue-300 bg-blue-500/10 w-fit px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl border border-blue-500/20">
              <CheckCircle2 size={16} className="md:w-6 md:h-6" />
              <span className="text-xs md:text-lg font-bold">{remainingTodos}개 남음</span>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col animate-in">
            <div className="flex items-center gap-1 mb-2 text-blue-400">
              <ChevronLeft size={16} />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">To-do List</span>
            </div>
            <div className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
              {TODO_DATA.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                  <span className={`text-[10px] md:text-sm truncate mr-2 ${t.done ? 'line-through text-slate-500 font-medium' : 'text-slate-200 font-bold'}`}>{t.text}</span>
                  <span className="text-[8px] md:text-[10px] text-slate-500 font-mono shrink-0">{t.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 위젯 3: 주가지수 */}
      <section className="rounded-[2rem] bg-slate-800/40 border border-white/10 p-4 md:p-6 flex flex-col justify-between shadow-xl backdrop-blur-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-[8px] md:text-xs font-bold mb-0.5 md:mb-1 uppercase tracking-tighter">KOSPI Index</p>
            <h3 className="text-xl md:text-3xl font-black text-white">{STOCK_DATA.index}</h3>
            <div className="flex items-center gap-1 text-emerald-400 text-[10px] md:text-sm mt-0.5 md:mt-1 font-bold">
              <ArrowUpRight size={12} className="md:w-4 md:h-4" />
              <span>{STOCK_DATA.change} ({STOCK_DATA.percent})</span>
            </div>
          </div>
          <TrendingUp className="text-emerald-500/50 w-5 h-5 md:w-7 md:h-7" />
        </div>
        
        <div className="h-10 md:h-16 w-full mt-2 md:mt-4">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`M ${STOCK_DATA.points.map((p, i) => `${i * 11.1},${40 - p * 0.4}`).join(' L ')}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={`M 0,40 L ${STOCK_DATA.points.map((p, i) => `${i * 11.1},${40 - p * 0.4}`).join(' L ')} L 100,40 Z`}
              fill="url(#stockGradient)"
            />
          </svg>
        </div>
      </section>

      {/* 위젯 4: 환율 */}
      <section className="rounded-[2rem] bg-slate-800/40 border border-white/10 p-4 md:p-6 flex flex-col justify-between shadow-xl backdrop-blur-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-[8px] md:text-xs font-bold mb-0.5 md:mb-1 uppercase tracking-tighter">USD / KRW</p>
            <div className="flex items-baseline gap-0.5 md:gap-1 text-white">
              <span className="text-xs md:text-lg text-slate-500 font-bold">₩</span>
              <h3 className="text-xl md:text-3xl lg:text-4xl font-black tracking-tight">{CURRENCY_DATA.rate}</h3>
            </div>
          </div>
          <div className="bg-blue-500/20 p-1.5 md:p-2.5 rounded-xl md:rounded-2xl">
            <DollarSign className="text-blue-400 w-4 h-4 md:w-6 md:h-6" />
          </div>
        </div>
        
        <div className="flex items-center justify-between border-t border-white/10 pt-2 md:pt-4">
          <div className="flex flex-col">
            <span className="text-[8px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Status</span>
            <div className="flex items-center gap-1 text-blue-400 text-[10px] md:text-sm font-black mt-1">
              <ArrowDownRight size={14} className="md:w-4 md:h-4" />
              <span>-{CURRENCY_DATA.change}</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-400 animate-pulse mb-0.5 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
            <p className="text-[7px] md:text-[10px] text-slate-600 font-bold tracking-tight uppercase">Live</p>
          </div>
        </div>
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
