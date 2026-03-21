import React, { useState, useContext } from 'react'; // ✅ useContext 추가
import { 
  Camera, Bike, Footprints, Fuel, Mountain, Waves, Dumbbell, 
  ChevronLeft, ChevronRight, Sparkles 
} from 'lucide-react';

import MemoryArchive from './RegionB/MemoryArchive';
import RunningLog from './RegionB/RunningLog'; // ✅ RunningLog 임포트 추가
import { AppContext } from './App'; // ✅ AppContext 임포트 추가

const RegionB = ({ isAdmin }) => {
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [path, setPath] = useState([]);

  // ✅ App.jsx에서 뿌려준 워커 주소와 비밀번호 가져오기
  const { RUNNING_WORKER_URL, adminPassword } = useContext(AppContext);

  const menuData = {
    photos: {
      label: '나의 기록',
      icon: <Camera size={24} />,
      color: 'from-blue-500 to-cyan-400',
      sub: [{ label: '2026' }, { label: '2025' }]
    },
    travel: {
      label: 'Bike Travel',
      icon: <Bike size={24} />,
      color: 'from-indigo-500 to-purple-400',
      sub: [{ label: '유라시아 2030', detail: ['루트 설계', '비자 확인'] }, { label: '국내 투어', detail: ['강원도 코스'] }]
    },
    running: { 
      label: '러닝 기록', 
      icon: <Footprints size={24} />, 
      color: 'from-emerald-500 to-teal-400', 
      sub: [{ label: '러닝 로그' }] 
    },
    fuel: { 
      label: '주유 기록', 
      icon: <Fuel size={24} />, 
      color: 'from-orange-500 to-amber-400', 
      sub: [{ label: '주유 기록' }] 
    },
    hiking: { 
      label: '등 산', 
      icon: <Mountain size={24} />, 
      color: 'from-green-500 to-lime-400', 
      sub: [{ label: '등산 기록' }] 
    },
    swimming: { 
      label: '수 영', 
      icon: <Waves size={24} />, 
      color: 'from-sky-500 to-blue-400', 
      sub: [{ label: '수영 일지' }] 
    },
    weight: { 
      label: '강철 체력', 
      icon: <Dumbbell size={24} />, 
      color: 'from-slate-500 to-gray-400', 
      sub: [{ label: '웨이트' }] 
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
  
  const goBack = () => { 
    if (step === 2) setStep(1); 
    else { 
      setStep(0);
      setPath([]); 
    } 
  };

  return (
    <div className="flex flex-col h-full text-white p-6">
      {step > 0 && (
        <div className="flex items-center gap-2 mb-6 text-sm font-medium tracking-wide">
          <button onClick={goBack} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={16} />
            뒤로가기
          </button>
          <span className="text-slate-600">|</span>
          <button onClick={() => setStep(0)} className="hover:text-indigo-400 transition-colors uppercase">
            유니버스
          </button>
          {path.map((p, i) => (
            <React.Fragment key={i}>
              <ChevronRight size={14} className="text-slate-600" />
              <span className={i === path.length - 1 ? "text-slate-100 font-bold" : "text-slate-400"}>{p}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {step === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
          {Object.keys(menuData).map((key) => (
            <div 
              key={key}
              onClick={() => handleMainClick(key)} 
              className={`relative p-4 bg-gradient-to-br ${menuData[key].color} rounded-2xl text-white shadow-lg transition-all duration-500 cursor-pointer hover:scale-105`}
            >
              <div className="flex flex-col items-center justify-center h-full gap-3 py-4">
                {menuData[key].icon}
                <span className="font-bold tracking-wider">{menuData[key].label}</span>
              </div>
            </div>
          ))}
        </div>
      ) : step === 1 ? (
        <div className="grid grid-cols-1 gap-4 flex-1 animate-fade-in-up">
          {menuData[selectedCategory].sub.map((sub, idx) => (
            <div 
              key={idx} 
              onClick={() => handleSubClick(sub)} 
              className="group bg-white/5 backdrop-blur-sm border border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl cursor-pointer transition-all hover:bg-white/10 flex justify-between items-center"
            >
              <span className="font-semibold text-lg">{sub.label}</span>
              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${menuData[selectedCategory].color} opacity-20 group-hover:opacity-100 transition-all text-white`}>
                {React.cloneElement(menuData[selectedCategory].icon, { size: 16 })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 w-full flex flex-col animate-fade-in-up overflow-y-auto pr-2">
          {/* ✅ 선택된 카테고리에 따라 분기 렌더링 */}
          {selectedCategory === 'photos' && (
            <MemoryArchive selectedSub={{ label: path[1] }} isAdmin={isAdmin} />
          )}

          {selectedCategory === 'running' && (
            <RunningLog 
              isAdmin={isAdmin} 
              workerUrl={RUNNING_WORKER_URL} 
              adminPassword={adminPassword} 
            />
          )}

          {selectedCategory !== 'photos' && selectedCategory !== 'running' && (
            <div className="text-center mt-10 text-gray-400 flex flex-col items-center justify-center h-full">
              <Sparkles size={48} className="mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-white mb-2">{path[1]}</h3>
              <p>Detail Exploration 준비 중</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegionB;
