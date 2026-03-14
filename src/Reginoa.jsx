import React from 'react';

export default function Regiona() {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full w-full">
      {/* 위젯 1 */}
      <div className="rounded-2xl bg-slate-800/40 border border-white/5 flex items-center justify-center shadow-inner hover:bg-slate-700/30 transition-colors duration-300">
        <span className="text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase">
          Widget 1
        </span>
      </div>

      {/* 위젯 2 */}
      <div className="rounded-2xl bg-slate-800/40 border border-white/5 flex items-center justify-center shadow-inner hover:bg-slate-700/30 transition-colors duration-300">
        <span className="text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase">
          Widget 2
        </span>
      </div>

      {/* 위젯 3 */}
      <div className="rounded-2xl bg-slate-800/40 border border-white/5 flex items-center justify-center shadow-inner hover:bg-slate-700/30 transition-colors duration-300">
        <span className="text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase">
          Widget 3
        </span>
      </div>

      {/* 위젯 4 */}
      <div className="rounded-2xl bg-slate-800/40 border border-white/5 flex items-center justify-center shadow-inner hover:bg-slate-700/30 transition-colors duration-300">
        <span className="text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase">
          Widget 4
        </span>
      </div>
    </div>
  );
}
