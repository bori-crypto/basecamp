import React, { useState, useEffect, useContext } from 'react';
import {
  Camera,
  Bike,
  Footprints,
  Fuel,
  Mountain,
  Waves,
  Dumbbell,
  ChevronLeft
} from 'lucide-react';

import MemoryArchive from './MemoryArchive';
import RunningLog from './RunningLog';
import BikeTravel from './Bike'; 
import { AppContext } from '../App';

const SecureImage = ({ src, alt, className }) => {
  const [imgUrl, setImgUrl] = useState(null);
  const imagePass = import.meta.env.VITE_IMAGE_PASS;
  const workerUrl = "https://basecamp-image-gatekeeper.borimundi.workers.dev";

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await fetch(`${workerUrl}/${src}`, {
          headers: { "X-Image-Pass": imagePass }
        });
        if (response.ok) {
          const blob = await response.blob();
          setImgUrl(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.error("Image load failed:", err);
      }
    };
    fetchImage();
    return () => imgUrl && URL.revokeObjectURL(imgUrl);
  }, [src, imagePass]);

  return imgUrl ? <img src={imgUrl} alt={alt} className={className} /> : <div className={`${className} bg-white/5 animate-pulse`} />;
};

const RegionB = ({ isAdmin, data }) => {
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [path, setPath] = useState([]);

  // ✅ AppContext에서 pushPage 가져오기
  const { RUNNING_WORKER_URL, adminPassword, pushPage } = useContext(AppContext);

  const menuData = {
    photos: {
      label: '나의 기록',
      icon: <Camera size={32} />,
      color: 'from-blue-500 to-cyan-400',
      sub: [
        { label: '2026', data: ["IMG_5985.JPG", "첫 기록 메모"] },
        { label: '2025', data: [] }
      ]
    },
    travel: {
      label: 'Bike Travel',
      icon: <Bike size={32} />,
      color: 'from-indigo-500 to-purple-400',
      sub: [
        { label: '2026' },
        { label: '2025' },
        { label: '2024' }
      ]
    },
    running: {
      label: '러닝 기록',
      icon: <Footprints size={32} />,
      color: 'from-emerald-500 to-teal-400',
      sub: [
        { label: '러닝 로그', detail: ['주간 기록', '월간 리포트', '개인 기록'] },
        { label: '장비 관리', detail: ['신발 마일리지', '워치 설정'] }
      ]
    },
    fuel: {
      label: '주유 기록',
      icon: <Fuel size={32} />,
      color: 'from-orange-500 to-amber-400',
      sub: [
        { label: '주유 기록', detail: ['최근 기록', '누적 금액', '주유소 찾기'] },
        { label: '연비 분석', detail: ['월별 연비'] }
      ]
    },
    hiking: {
      label: '등 산',
      icon: <Mountain size={32} />,
      color: 'from-green-500 to-lime-400',
      sub: [
        { label: '등산 기록', detail: ['최근 등반', '누적 고도'] },
        { label: '장비 체크', detail: ['등산화 상태'] }
      ]
    },
    swimming: {
      label: '수 영',
      icon: <Waves size={32} />,
      color: 'from-sky-500 to-blue-400',
      sub: [
        { label: '수영 일지', detail: ['바퀴 수', '영법 분석'] }
      ]
    },
    weight: {
      label: '강철 체력',
      icon: <Dumbbell size={32} />,
      color: 'from-slate-500 to-gray-400',
      sub: [
        { label: '웨이트', detail: ['3대 측정', '분할 루틴'] }
      ]
    }
  };

  const handleMainClick = (key) => {
    setSelectedCategory(key);
    setPath([menuData[key].label]);
    setStep(1);
  };

  const handleSubClick = (subItem) => {
    setPath([path[0], subItem.label]);
    setStep(2);
  };

  const jumpToStep = (targetStep) => {
    if (targetStep === 0) {
      setStep(0);
      setSelectedCategory(null);
      setPath([]);
    } else if (targetStep === 1 && step >= 2) {
      setStep(1);
      setPath([path[0]]);
    }
  };

  const goBack = () => {
    if (step === 2) jumpToStep(1);
    else jumpToStep(0);
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 lg:p-6 overflow-y-auto custom-scrollbar relative text-white">
      {step > 0 && (
        <div className="flex items-center gap-3 animate-in fade-in duration-300">
          <button
            onClick={goBack}
            className="group flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all text-xs font-medium border border-white/10 text-white shadow-lg"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            뒤로가기
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium flex-wrap bg-slate-900/40 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/5">
            <button onClick={() => jumpToStep(0)} className="hover:text-indigo-400 transition-colors uppercase tracking-wider">유니버스</button>
            {path.map((p, i) => (
              <React.Fragment key={i}>
                <span className="text-white/20 select-none">{'>'}</span>
                <button
                  onClick={() => i === 0 && step > 1 && jumpToStep(1)}
                  className={`transition-colors whitespace-pre ${i === path.length - 1 ? "text-slate-100 font-bold cursor-default" : "hover:text-slate-300 cursor-pointer"}`}
                >
                  {p}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 animate-in fade-in duration-500">
        {step === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(menuData).map((key) => (
              <div key={key} className="group flex flex-col items-center justify-center p-2">
                <div
                  onClick={() => handleMainClick(key)}
                  className={`relative p-4 bg-gradient-to-br ${menuData[key].color} rounded-2xl text-white shadow-lg transition-all duration-500 cursor-pointer hover:scale-110 hover:rotate-6 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]`}
                >
                  {menuData[key].icon}
                </div>
                <div className="mt-3 text-center">
                  <div className="text-xs font-bold text-slate-300 whitespace-pre group-hover:text-white uppercase tracking-tighter transition-colors">
                    {menuData[key].label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : step === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuData[selectedCategory].sub.map((subItem, idx) => (
              <div
                key={idx}
                className="group bg-white/5 backdrop-blur-sm border border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl cursor-pointer transition-all hover:bg-white/10 flex items-center justify-between"
                onClick={() => handleSubClick(subItem)}
              >
                <span className="text-slate-200 font-medium">{subItem.label}</span>
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${menuData[selectedCategory].color} opacity-20 group-hover:opacity-100 transition-all text-white`}>
                  {React.cloneElement(menuData[selectedCategory].icon, { size: 16 })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full">
            {selectedCategory === 'travel' ? (
              <BikeTravel 
                step={step} 
                path={path} 
                onSelect={(routeName) => {
                  // ✅ 핵심: App.jsx의 pushPage를 사용하여 독립된 전체 화면 페이지 호출!
                  pushPage('bike-map', routeName, Bike);
                }} 
              />
            ) : selectedCategory === 'photos' ? (
              <MemoryArchive
                selectedSub={menuData.photos.sub.find(s => s.label === path[1])}
                isAdmin={isAdmin}
              />
            ) : selectedCategory === 'running' && path[1] === '러닝 로그' ? (
              <RunningLog
                isAdmin={isAdmin}
                workerUrl={RUNNING_WORKER_URL}
                adminPassword={adminPassword}
              />
            ) : (
              <div className={`p-6 rounded-2xl bg-gradient-to-br ${menuData[selectedCategory].color} text-white`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white/20 rounded-xl">{React.cloneElement(menuData[selectedCategory].icon, { size: 24 })}</div>
                  <div>
                    <h2 className="text-2xl font-bold">{path[1]}</h2>
                    <p className="text-sm opacity-80 uppercase tracking-widest mt-1">Detail Exploration</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuData[selectedCategory].sub.find(s => s.label === path[1])?.detail?.map((item, idx) => (
                    <div key={idx} className="bg-black/20 p-4 rounded-xl flex items-center gap-3 hover:bg-black/30 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-white/50" />
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionB;
