import React, { useState, useEffect } from 'react';
import {
  Camera,
  Motorcycle,
  Footprints,
  Fuel,
  Mountain,
  Waves,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

// R2 사진을 안전하게 불러오기 위한 컴포넌트
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

const RegionB = ({ isAdmin, data }) => {
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [path, setPath] = useState([]);

  const menuData = {
    photos: {
      label: '나의 기록',
      icon: <Camera size={24} />,
      color: 'from-blue-500 to-cyan-400',
      sub: [
        { label: '최근 사진', detail: ['tour-1.jpg', 'tour-2.jpg', 'run-1.jpg'] }, // R2에 저장된 파일명 예시
        { label: '앨범별', detail: ['인물', '장소', '카테고리'] }
      ]
    },
    travel: {
      label: 'Bike Travel',
      icon: <Motorcycle size={24} />,
      color: 'from-indigo-500 to-purple-400',
      sub: [
        { label: '유라시아 2030', detail: ['루트 설계', '비자 확인'] },
        { label: '국내 투어', detail: ['경상도 코스', '강원도 코스'] }
      ]
    },
    running: {
      label: '러닝 기록',
      icon: <Footprints size={24} />,
      color: 'from-emerald-500 to-teal-400',
      sub: [
        { label: '러닝 로그', detail: ['주간 기록', '월간 리포트'] }
      ]
    },
    fuel: {
      label: '주유 기록',
      icon: <Fuel size={24} />,
      color: 'from-orange-500 to-amber-400',
      sub: [
        { label: '주유 기록', detail: ['최근 기록', '연비 분석'] }
      ]
    },
    hiking: {
      label: '등 산',
      icon: <Mountain size={24} />,
      color: 'from-green-500 to-lime-400',
      sub: [
        { label: '등산 기록', detail: ['최근 등반'] }
      ]
    },
    swimming: {
      label: '수 영',
      icon: <Waves size={24} />,
      color: 'from-sky-500 to-blue-400',
      sub: [
        { label: '수영 일지', detail: ['바퀴 수'] }
      ]
    },
    weight: {
      label: '강철 체력',
      icon: <Dumbbell size={24} />,
      color: 'from-slate-500 to-gray-400',
      sub: [
        { label: '웨이트', detail: ['3대 측정'] }
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
    } else if (targetStep === 1 && step === 2) {
      setStep(1);
      setPath([path[0]]);
    }
  };

  const goBack = () => {
    if (step === 2) jumpToStep(1);
    else jumpToStep(0);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {step > 0 && (
        <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black tracking-widest animate-in">
          <button onClick={goBack} className="group flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all text-xs font-medium border border-white/10">
            <ChevronLeft size={14} />
            뒤로가기
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => jumpToStep(0)} className="hover:text-indigo-400 transition-colors uppercase tracking-wider">유니버스</button>
            {path.map((p, i) => (
              <React.Fragment key={i}>
                <span className="opacity-30">/</span>
                <button onClick={() => i === 0 && jumpToStep(1)} className={`transition-colors whitespace-pre ${i === path.length - 1 ? "text-slate-100 font-bold cursor-default" : "hover:text-slate-300 cursor-pointer"}`}>
                  {p}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {step === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
            {Object.keys(menuData).map((key) => (
              <div key={key} onClick={() => handleMainClick(key)} className={`relative p-4 bg-gradient-to-br ${menuData[key].color} rounded-2xl text-white shadow-lg transition-all duration-500 cursor-pointer hover:scale-105 hover:rotate-2 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]`}>
                <div className="mb-8 opacity-90">{menuData[key].icon}</div>
                <div className="font-black text-sm tracking-tighter">{menuData[key].label}</div>
              </div>
            ))}
          </div>
        ) : step === 1 ? (
          <div className="grid gap-3 animate-in">
            {menuData[selectedCategory].sub.map((subItem, idx) => (
              <div key={idx} className="group bg-white/5 backdrop-blur-sm border border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl cursor-pointer transition-all hover:bg-white/10 flex items-center justify-between" onClick={() => handleSubClick(subItem)}>
                <span className="text-slate-200 font-bold">{subItem.label}</span>
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${menuData[selectedCategory].color} opacity-20 group-hover:opacity-100 transition-all text-white`}>
                  {React.cloneElement(menuData[selectedCategory].icon, { size: 16 })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 animate-in">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${menuData[selectedCategory].color} text-white`}>
                {React.cloneElement(menuData[selectedCategory].icon, { size: 20 })}
              </div>
              <h3 className="text-xl font-black text-white">{path[1]}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {menuData[selectedCategory].sub.find(s => s.label === path[1]).detail.map((item, idx) => (
                selectedCategory === 'photos' && item.endsWith('.jpg') ? (
                  <SecureImage key={idx} src={item} alt={item} className="w-full h-32 object-cover rounded-xl border border-white/10" />
                ) : (
                  <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 text-slate-300 text-sm flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-400" />
                    {item}
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionB;
