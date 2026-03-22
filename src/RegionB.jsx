import React, { useState, useEffect, useContext } from 'react';
import {
  Camera, Bike, Footprints, Fuel, Mountain, Waves, Dumbbell,
  ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';

// 상세 페이지 및 컨텍스트 임포트
import MemoryArchive from './RegionB/MemoryArchive';
import RunningLog from './RegionB/RunningLog';
import GearManagement from './RegionB/GearManagement'; // ✅ 새로 추가할 컴포넌트 임포트
import { AppContext } from './App';

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
  }, [src]);

  return imgUrl ? <img src={imgUrl} alt={alt} className={className} /> : <div className={`${className} bg-white/5 animate-pulse`} />;
};

const RegionB = ({ isAdmin }) => {
  const { RUNNING_WORKER_URL, adminPassword } = useContext(AppContext);
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [path, setPath] = useState([]);

  const menuData = {
    photos: { label: '추억 저장소', icon: <Camera size={24} />, color: 'from-pink-500 to-rose-500', sub: [{ label: '2026' }, { label: '2025' }, { label: '2024' }] },
    running: { 
      label: '러닝 기록', 
      icon: <Footprints size={24} />, 
      color: 'from-emerald-500 to-teal-500', 
      sub: [{ label: '러닝 로그' }, { label: '신발 마일리지' }] 
    },
    riding: { label: '라이딩', icon: <Bike size={24} />, color: 'from-blue-500 to-indigo-500', sub: [{ label: '투어 로그' }, { label: '정비 기록' }] },
    hiking: { label: '등산', icon: <Mountain size={24} />, color: 'from-amber-500 to-orange-500', sub: [{ label: '정복 리스트' }, { label: '산행 정보' }] }
  };

  const handleCategoryClick = (key) => {
    setSelectedCategory(key);
    setPath([menuData[key].label]);
    setStep(1);
  };

  const handleSubClick = (subItem) => {
    setPath([...path, subItem.label]);
    setStep(2);
  };

  const goBack = () => {
    if (step === 1) {
      setStep(0);
      setSelectedCategory(null);
      setPath([]);
    } else if (step === 2) {
      setStep(1);
      setPath([path[0]]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Sparkles size={16} className="text-indigo-400" />
          {path.length === 0 ? <span>Basecamp Archive</span> : (
            <div className="flex items-center gap-1">
              <span className="hover:text-white cursor-pointer" onClick={() => {setStep(0); setPath([]);}}>{path[0]}</span>
              {path[1] && <><ChevronRight size={12} /> <span className="text-white font-bold">{path[1]}</span></>}
            </div>
          )}
        </div>
        {step > 0 && (
          <button onClick={goBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {step === 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(menuData).map((key) => (
              <div
                key={key}
                onClick={() => handleCategoryClick(key)}
                className={`group relative overflow-hidden p-6 bg-gradient-to-br ${menuData[key].color} rounded-2xl text-white shadow-lg transition-all duration-500 cursor-pointer hover:scale-110 hover:rotate-6 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.03)]`}
              >
                <div className="flex flex-col gap-3 relative z-10">
                  {menuData[key].icon}
                  <span className="font-bold text-lg">{menuData[key].label}</span>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  {React.cloneElement(menuData[key].icon, { size: 100 })}
                </div>
              </div>
            ))}
          </div>
        ) : step === 1 ? (
          <div className="grid grid-cols-1 gap-3">
            {menuData[selectedCategory].sub.map((subItem, idx) => (
              <div
                key={idx}
                onClick={() => handleSubClick(subItem)}
                className="group bg-white/5 backdrop-blur-sm border border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl cursor-pointer transition-all hover:bg-white/10 flex items-center justify-between"
              >
                <span className="text-white font-medium">{subItem.label}</span>
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${menuData[selectedCategory].color} opacity-20 group-hover:opacity-100 transition-all text-white`}>
                  {React.cloneElement(menuData[selectedCategory].icon, { size: 16 })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {selectedCategory === 'photos' ? (
              <MemoryArchive selectedSub={menuData.photos.sub.find(s => s.label === path[1])} isAdmin={isAdmin} />
            ) : selectedCategory === 'running' && path[1] === '러닝 로그' ? (
              <RunningLog isAdmin={isAdmin} workerUrl={RUNNING_WORKER_URL} adminPassword={adminPassword} />
            ) : selectedCategory === 'running' && path[1] === '신발 마일리지' ? (
              // ✅ Step 2: 신발 마일리지 화면 연결
              <GearManagement isAdmin={isAdmin} workerUrl={RUNNING_WORKER_URL} adminPassword={adminPassword} />
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500 text-sm italic">
                준비 중인 상세 페이지입니다: {path[1]}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionB;
