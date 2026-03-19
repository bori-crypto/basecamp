import React, { useState } from 'react';
import {
  Camera,
  Bike,
  Footprints,
  Fuel,
  Mountain,
  Waves,
  Dumbbell,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
// 오빠가 지정한 경로로 임포트 문 수정
import MemoryArchive from './RegionB/MemoryArchive';

const RegionB = ({ isAdmin }) => {
  // step: 0(유니버스), 1(궤도 진입), 2(탐사 시작)
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);

  // menuData: '나의 기록' 구역만 연도별 체계로 수정
  const menuData = {
    myRecords: {
      label: "나의 기록",
      icon: <Camera size={24} />,
      color: "from-blue-500 to-cyan-500",
      sub: [
        { label: "2026", data: ["IMG_5985.JPG", "첫 기록 메모"] },
        { label: "2025", data: [] }
      ]
    },
    bikeTravel: {
      label: "Bike Travel",
      icon: <Bike size={24} />,
      color: "from-indigo-500 to-purple-500",
      sub: [
        { label: "투어 경로", data: ["속초 투어"] },
        { label: "정비 일지", data: ["엔진오일 교체"] }
      ]
    },
    running: {
      label: "러닝 기록",
      icon: <Footprints size={24} />,
      color: "from-emerald-500 to-teal-500",
      sub: [{ label: "최근 활동", data: [] }]
    },
    fueling: {
      label: "주유 기록",
      icon: <Fuel size={24} />,
      color: "from-orange-500 to-amber-500",
      sub: [{ label: "차계부", data: [] }]
    },
    hiking: {
      label: "등    산",
      icon: <Mountain size={24} />,
      color: "from-green-500 to-lime-500",
      sub: [{ label: "정복한 산", data: [] }]
    },
    swimming: {
      label: "수    영",
      icon: <Waves size={24} />,
      color: "from-sky-400 to-blue-600",
      sub: [{ label: "기록 측정", data: [] }]
    },
    fitness: {
      label: "강철 체력",
      icon: <Dumbbell size={24} />,
      color: "from-slate-500 to-gray-700",
      sub: [{ label: "루틴", data: [] }]
    }
  };

  const handleMainClick = (key) => {
    setSelectedCategory(key);
    setStep(1);
  };

  const handleSubClick = (subItem) => {
    setSelectedSub(subItem);
    setStep(2);
  };

  const goBack = () => {
    if (step === 2) setStep(1);
    else if (step === 1) setStep(0);
  };

  const currentCategory = menuData[selectedCategory];

  return (
    <div className="w-full h-full text-white font-sans">
      {/* 상단 네비게이션 헤더 */}
      {step > 0 && (
        <div className="flex items-center space-x-2 mb-6 animate-in fade-in duration-500">
          <button 
            onClick={goBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center text-xs font-bold tracking-widest uppercase opacity-50">
            <span className="cursor-pointer hover:text-white" onClick={() => setStep(0)}>Universe</span>
            <span className="mx-2 text-[8px] opacity-30">/</span>
            <span className="text-cyan-400">{currentCategory?.label}</span>
            {step === 2 && (
              <>
                <span className="mx-2 text-[8px] opacity-30">/</span>
                <span className="text-white">{selectedSub?.label}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 영역 */}
      <div className="relative">
        {step === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.keys(menuData).map((key) => (
              <div
                key={key}
                onClick={() => handleMainClick(key)}
                className={`relative p-6 bg-gradient-to-br ${menuData[key].color} rounded-[2rem]
                           flex flex-col items-center justify-center space-y-3 cursor-pointer
                           transition-all duration-500 hover:scale-110 hover:rotate-6
                           shadow-lg hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]`}
              >
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  {menuData[key].icon}
                </div>
                <span className="font-black text-sm tracking-tighter">{menuData[key].label}</span>
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentCategory?.sub.map((subItem, idx) => (
              <div
                key={idx}
                onClick={() => handleSubClick(subItem)}
                className="group p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl
                           flex items-center justify-between cursor-pointer transition-all duration-300
                           hover:bg-white/10 hover:border-white/30"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${currentCategory.color} opacity-80 group-hover:scale-110 transition-transform`}>
                    {currentCategory.icon}
                  </div>
                  <span className="text-lg font-bold">{subItem.label}</span>
                </div>
                <Sparkles size={18} className="text-white/20 group-hover:text-cyan-400 transition-colors" />
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          /* 기존 상세 코드를 MemoryArchive 컴포넌트로 대체 */
          <MemoryArchive 
            selectedSub={selectedSub} 
            isAdmin={isAdmin} 
          />
        )}
      </div>
    </div>
  );
};

export default RegionB;
