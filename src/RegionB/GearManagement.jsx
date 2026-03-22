import React, { useState } from 'react';
import { Footprints, Camera, Sparkles } from 'lucide-react';

export default function GearManagement({ isAdmin, workerUrl, adminPassword }) {
  return (
    <div className="flex flex-col gap-6 w-full text-white pb-10">
      {/* 상단 헤더 */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl text-center">
        <div className="inline-flex p-4 bg-indigo-500/20 rounded-full text-indigo-400 mb-4">
          <Footprints size={32} />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tighter">신발 마일리지 자동화</h2>
        <p className="text-slate-400 text-xs mt-2 font-medium italic">사진 한 장으로 러닝 기록을 자동으로 완성합니다.</p>
      </div>

      {/* 스마트 입력 영역 (드롭존 예정) */}
      <div className="bg-white/5 backdrop-blur-md border border-dashed border-white/20 p-10 rounded-[2rem] flex flex-col items-center justify-center gap-4 group hover:border-indigo-500/50 transition-all cursor-pointer shadow-inner">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
          <Camera size={32} />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-300">러닝 스크린샷 업로드</p>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">AI Vision Processing Waiting...</p>
        </div>
      </div>
      
      <div className="text-center py-4">
        <span className="text-[10px] text-slate-600 uppercase tracking-[0.3em] animate-pulse">Step 3: Worker Integration Needed</span>
      </div>
    </div>
  );
}
