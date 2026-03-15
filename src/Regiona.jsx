import React, { useState } from 'react';
import { 
  Sun, Wind, Calendar, CheckCircle2, 
  TrendingUp, DollarSign, ChevronLeft, Cloud, 
  CloudRain, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const CURRENCY_DATA = { rate: "1,342.50", change: "2.10" };
const FORECAST_MOCK = [
  { day: 'Mon', temp: 14, icon: <Sun size={12} /> },
  { day: 'Tue', temp: 11, icon: <Cloud size={12} /> },
  { day: 'Wed', temp: 9, icon: <CloudRain size={12} /> },
];

export default function Regiona({ data }) {
  const [isListOpen, setIsListOpen] = useState(false);

  const weather = data?.weather || { temp: "--", wind: "--", windDir: "--" };
  const stock = data?.stock || { index: "----.--", change: "--", percent: "--" };
  const todos = data?.todo;
  const remainingTodos = Array.isArray(todos) ? todos.length : (todos?.count || 0);
  const todoList = Array.isArray(todos) ? todos : [];

  // [수정] 날짜 포맷팅 함수 (연도 포함 여부 결정)
  const getFullDate = () => new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' });
  const getShortDate = () => new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' });

  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-2 font-sans text-slate-200 overflow-hidden">
      
      {/* 위젯 1: 날씨 */}
      <section className="rounded-3xl bg-slate-800/40 border border-white/10 p-3 md:p-5 landscape:p-2 lg:landscape:p-5 flex flex-col justify-between shadow-xl backdrop-blur-md overflow-hidden">
        <div className="flex justify-between items-center gap-1">
          <div className="flex items-center gap-1 md:gap-2">
            <Sun className="text-yellow-400 w-5 h-5 md:w-8 md:h-8 shrink-0" />
            <span className="text-lg sm:text-2xl md:text-3xl landscape:text-base lg:landscape:text-3xl font-black text-white leading-none">{weather.temp}°</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 text-blue-300 min-w-0">
            <Wind className="w-5 h-5 md:w-8 md:h-8 landscape:w-4 landscape:h-4 lg:landscape:w-8 lg:landscape:h-8 shrink-0" />
            <div className="flex flex-col items-start leading-none min-w-0">
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg sm:text-2xl md:text-3xl landscape:text-base lg:landscape:text-3xl font-black text-white truncate">{weather.wind}</span>
                <span className="text-[7px] md:text-[9px] font-medium text-slate-500 uppercase">m/s</span>
              </div>
              <span className="text-[9px] md:text-xs landscape:text-[8px] lg:landscape:text-xs font-bold text-blue-300/80 uppercase truncate w-full">{weather.windDir}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center bg-white/5 rounded-xl p-2 md:p-3 mt-2 landscape:p-1 landscape:mt-1 lg:landscape:p-3 lg:landscape:mt-2">
          {FORECAST_MOCK.map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-[7px] md:text-[9px] text-slate-400 uppercase font-bold">{f.day}</span>
              <div className="scale-75 md:scale-90 landscape:scale-50 lg:landscape:scale-90">{f.icon}</div>
              <span className="text-[9px] md:text-xs landscape:text-[8px] lg:landscape:text-xs font-bold">{f.temp}°</span>
            </div>
          ))}
        </div>
      </section>

      {/* 위젯 2: 할 일 (반응형 날짜 적용) */}
      <section 
        role="button" onClick={() => setIsListOpen(!isListOpen)}
        className="rounded-3xl bg-slate-800/40 border border-white/10 p-3 md:p-5 landscape:p-2 lg:landscape:p-5 cursor-pointer hover:bg-slate-700/40 active:scale-[0.98] transition-all duration-300 shadow-xl overflow-hidden relative backdrop-blur-md flex flex-col"
      >
        {!isListOpen ? (
          <div className="h-full flex flex-col justify-center gap-3 landscape:gap-1.5 lg:landscape:gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <Calendar className="text-blue-400 shrink-0 w-5 h-5 md:w-7 md:h-7 landscape:w-4 landscape:h-4 lg:landscape:w-7 lg:landscape:h-7" />
              <div className="text-base sm:text-xl md:text-2xl lg:text-3xl landscape:text-sm lg:landscape:text-3xl font-black tracking-tighter text-white whitespace-nowrap leading-none truncate">
                {/* [수정] 화면 너비에 따라 날짜 표시 방식 전환 (sm 미만 세로에서는 짧게) */}
                <span className="sm:inline hidden">{getFullDate()}</span>
                <span className="sm:hidden inline">{getShortDate()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-blue-300 bg-blue-500/10 w-fit px-2.5 py-1 md:px-4 md:py-2 landscape:px-2 landscape:py-0.5 lg:landscape:px-4 lg:landscape:py-2 rounded-lg md:rounded-xl border border-blue-500/20">
              <CheckCircle2 size={14} className="md:w-5 md:h-5 landscape:w-3 landscape:h-3 lg:landscape:w-5 lg:landscape:h-5" />
              <span className="text-[10px] md:text-base landscape:text-[9px] lg:landscape:text-base font-bold whitespace-nowrap">{remainingTodos}개 일정</span>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col animate-in">
            <div className="flex items-center gap-1 mb-2 landscape:mb-1 lg:landscape:mb-2 text-blue-400">
              <ChevronLeft size={14} className="landscape:w-3 landscape:h-3 lg:landscape:w-[14px] lg:landscape:h-[14px]" />
              <span className="text-[9px] md:text-xs landscape:text-[8px] lg:landscape:text-xs font-black uppercase tracking-widest leading-none">Calendar</span>
            </div>
            <div className="space-y-1 overflow-y-auto pr-1 custom-scrollbar">
              {todoList.length > 0 ? todoList.map((t, idx) => (
                <div key={t.id || idx} className="flex items-center justify-between bg-white/5 p-1.5 md:p-2 landscape:p-1 lg:landscape:p-2 rounded-lg border border-white/5">
                  <span className="text-[9px] md:text-xs landscape:text-[8px] lg:landscape:text-xs truncate mr-1 text-slate-200 font-bold">{t.text}</span>
                  <span className="text-[7px] md:text-[9px] landscape:text-[7px] lg:landscape:text-[9px] text-slate-500 font-mono shrink-0">{t.date}</span>
                </div>
              )) : (
                <div className="text-[9px] md:text-xs landscape:text-[8px] lg:landscape:text-xs text-slate-500 text-center py-4 landscape:py-1 lg:landscape:py-4">
                  {Array.isArray(todos) ? "일정이 없습니다" : "인증이 필요합니다"}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 위젯 3: 주가지수 */}
      <section className="rounded-3xl bg-slate-800/40 border border-white/10 p-3 md:p-5 landscape:p-2 lg:landscape:p-5 flex flex-col justify-between shadow-xl backdrop-blur-md overflow-hidden">
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <p className="text-slate-400 text-[7px] md:text-xs landscape:text-[7px] lg:landscape:text-xs font-bold mb-0.5 uppercase tracking-tighter">KOSPI Index</p>
            <h3 className="text-lg md:text-2xl lg:text-3xl landscape:text-base lg:landscape:text-3xl font-black text-white truncate leading-none">{stock.index}</h3>
            <div className="flex items-center gap-0.5 text-emerald-400 text-[9px] md:text-sm landscape:text-[8px] lg:landscape:text-sm mt-1 font-bold">
              <ArrowUpRight size={10} className="md:w-4 md:h-4 landscape:w-3 landscape:h-3 lg:landscape:w-4 lg:landscape:h-4" />
              <span className="truncate">{stock.change} ({stock.percent}%)</span>
            </div>
          </div>
          <TrendingUp className="text-emerald-500/50 w-5 h-5 md:w-7 md:h-7 landscape:w-4 landscape:h-4 lg:landscape:w-7 lg:landscape:h-7 shrink-0" />
        </div>
        <div className="h-10 md:h-14 landscape:h-6 lg:landscape:h-14 w-full mt-2 landscape:mt-1 lg:landscape:mt-2">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <path d="M 0,30 L 10,25 L 20,35 L 30,20 L 40,25 L 50,15 L 60,20 L 70,10 L 80,15 L 90,5 L 100,10" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* 위젯 4: 환율 */}
      <section className="rounded-3xl bg-slate-800/40 border border-white/10 p-3 md:p-5 landscape:p-2 lg:landscape:p-5 flex flex-col justify-between shadow-xl backdrop-blur-md overflow-hidden">
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <p className="text-slate-400 text-[7px] md:text-xs landscape:text-[7px] lg:landscape:text-xs font-bold mb-0.5 uppercase tracking-tighter">USD / KRW</p>
            <div className="flex items-baseline gap-0.5 text-white">
              <span className="text-[10px] md:text-lg landscape:text-[9px] lg:landscape:text-lg text-slate-500 font-bold">₩</span>
              <h3 className="text-lg md:text-2xl lg:text-3xl landscape:text-base lg:landscape:text-3xl font-black tracking-tight truncate leading-none">{CURRENCY_DATA.rate}</h3>
            </div>
          </div>
          <div className="bg-blue-500/20 p-1 md:p-2 landscape:p-1 lg:landscape:p-2 rounded-xl">
            <DollarSign className="text-blue-400 w-4 h-4 md:w-6 md:h-6 landscape:w-3 landscape:h-3 lg:landscape:w-6 lg:landscape:h-6 shrink-0" />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-2 mt-1 landscape:pt-1 landscape:mt-0.5 lg:landscape:pt-2 lg:landscape:mt-1">
          <div className="flex flex-col min-w-0">
            <span className="text-[7px] md:text-[10px] landscape:text-[6px] lg:landscape:text-[10px] text-slate-500 uppercase font-black leading-none">Status</span>
            <div className="flex items-center gap-0.5 text-blue-400 text-[9px] md:text-xs landscape:text-[8px] lg:landscape:text-xs font-black mt-1 landscape:mt-0.5 lg:landscape:mt-1">
              <ArrowDownRight size={10} className="md:w-3 md:h-3 landscape:w-2 landscape:h-2 lg:landscape:w-3 lg:landscape:h-3" />
              <span className="truncate">-{CURRENCY_DATA.change}</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end shrink-0">
            <div className="w-1.5 h-1.5 landscape:w-1 landscape:h-1 lg:landscape:w-1.5 lg:landscape:h-1.5 rounded-full bg-blue-400 animate-pulse mb-0.5"></div>
            <p className="text-[7px] md:text-[9px] landscape:text-[6px] lg:landscape:text-[9px] text-slate-600 font-bold uppercase tracking-tight">Live</p>
          </div>
        </div>
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}
