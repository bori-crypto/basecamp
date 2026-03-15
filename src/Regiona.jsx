import React, { useState } from 'react';
import { 
  Sun, CloudRain, Wind, Calendar, CheckCircle2, 
  TrendingUp, DollarSign, ChevronLeft, Cloud, 
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// --- 데이터 상수 ---
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
    /* 모바일에서는 1열, PC에서는 2열로 자동 전환 */
    <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-slate-200 p-2 md:p-0">
      
      {/* 위젯 1: 날씨 */}
      <section className="rounded-3xl bg-slate-800/40 border border-white/10 p-5 md:p-6 flex flex-col justify-between shadow-xl backdrop-blur-md hover:bg-slate-800/50 transition-colors min-h-[180px]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <Sun className="text-yellow-400 w-8 h-8 md:w-10 md:h-10" />
            <span className="text-3xl md:text-4xl font-black text-white">{WEATHER_DATA.current.temp}°</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3 text-blue-300">
            <Wind className="w-8 h-8 md:w-10 md:h-10" />
            <div className="flex flex-col items-start leading-none">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl md:text-4xl font-black text-white">{WEATHER_DATA.current.wind}</span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">m/s</span>
              </div>
              <span className="text-xs md:text-sm font-bold text-blue-300/80 mt-1 uppercase tracking-widest">
                {WEATHER_DATA.current.windDir}
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center bg-white/5 rounded-2xl p-3 md:p-4 mt-4">
          {WEATHER_DATA.forecast.map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold tracking-wider">{f.day}</span>
              {f.icon}
              <span className="text-xs md:text-sm font-bold">{f.temp}°</span>
            </div>
          ))}
        </div>
      </section>

      {/* 위젯 2: 할 일 (글자 크기 모바일 최적화) */}
      <section 
        role="button"
        tabIndex={0}
        onClick={() => setIsListOpen(!isListOpen)}
        className="rounded-3xl bg-slate-800/40 border border-white/10 p-5 md:p-6 cursor-pointer hover:bg-slate-700/40 active:scale-[0.98] transition-all duration-300 shadow-xl overflow-hidden relative backdrop-blur-md min-h-[180px]"
      >
        {!isListOpen ? (
          <div className="h-full flex flex-col justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 overflow-hidden">
              <Calendar className="text-blue-400 shrink-0 w-6 h-6 md:w-8 md:h-8" />
              <span className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-white whitespace-nowrap leading-none">
                2026.3.15. (일)
              </span>
            </div>
            <div className="flex items-center gap-3 text-blue-300 bg-blue-500/10 w-fit px-4 py-2 rounded-2xl border border-blue-500/20">
              <CheckCircle2 size={20} className="md:w-6 md:h-6" />
              <span className="text-sm md:text-lg font-bold">{remainingTodos}개의 할 일 남음</span>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col animate-in">
            <div className="flex items-center gap-2 mb-4 text-blue-400">
              <ChevronLeft size={20} />
              <span className="text-xs md:text-sm font-black uppercase tracking-widest">Weekly To-do</span>
            </div>
            <div className="space-y-2 overflow-y-auto pr-1 max-h-[150px] md:max-h-none custom-scrollbar">
              {TODO_DATA.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                  <span className={`text-xs md:text-sm ${t.done ? 'line-through text-slate-500 font-medium' : 'text-slate-200 font-bold'}`}>{t.text}</span>
                  <span className="text-[9px] md:text-[10px] text-slate-500 font-mono">{t.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 위젯 3: 주가지수 */}
      <section className="rounded-3xl bg-slate-800/40 border border-white/10 p-5 md:p-6 flex flex-col justify-between shadow-xl backdrop-blur-md min-h-[180px]">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-[10px] md:text-xs font-bold mb-1 uppercase tracking-tighter">KOSPI Index</p>
            <h3 className="text-2xl md:text-3xl font-black text-white">{STOCK_DATA.index}</h3>
            <div className="flex items-center gap-1 text-emerald-400 text-xs md:text-sm mt-1 font-bold">
              <ArrowUpRight size={14} md:size={16} />
              <span>{STOCK_DATA.change} ({STOCK_DATA.percent})</span>
            </div>
          </div>
          <TrendingUp className="text-emerald-500/50 w-6 h-6 md:w-7 md:h-7" />
        </div>
        <div className="h-12 md:h-16 w-full mt-4">
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
      <section className="rounded-3xl bg-slate-800/40 border border-white/10 p-5 md:p-6 flex flex-col justify-between shadow-xl backdrop-blur-md min-h-[180px]">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-[10px] md:text-xs font-bold mb-1 uppercase tracking-tighter">USD / KRW</p>
            <div className="flex items-baseline gap-1 text-white">
              <span className="text-sm md:text-lg text-slate-500 font-bold">₩</span>
              <h3 className="text-3xl md:text-4xl font-black tracking-tight">{CURRENCY_DATA.rate}</h3>
            </div>
          </div>
          <div className="bg-blue-500/20 p-2 md:p-2.5 rounded-2xl">
            <DollarSign className="text-blue-400 w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2 md:mt-0">
          <div className="flex flex-col">
            <span className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest">Market Status</span>
            <div className="flex items-center gap-1 text-blue-400 text-xs md:text-sm font-black mt-1">
              <ArrowDownRight size={16} md:size={18} />
              <span>-{CURRENCY_DATA.change}</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-400 animate-pulse mb-1 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
            <p className="text-[8px] md:text-[10px] text-slate-600 font-bold tracking-tight">LIVE UPDATE</p>
          </div>
        </div>
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
