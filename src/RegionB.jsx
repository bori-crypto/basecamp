import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Bike, 
  Footprints, 
  Fuel, 
  Mountain, 
  Waves, 
  Dumbbell,
  ChevronLeft, 
  ChevronRight, 
  Sparkles
} from 'lucide-react';

// R2 사진을 안전하게 불러오기 위한 컴포넌트 (비밀번호 인증 내재화)
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
  // step: 0(유니버스), 1(궤도 진입), 2(탐사 시작)
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [path, setPath] = useState([]);

  // 7개 아이콘 데이터
  const menuData = {
    photos: {
      label: '나의 기록',
      icon: <Camera size={32} />,
      color: 'from-blue-500 to-cyan-400',
      sub: [
        { label: '갤러리', detail: ['최근 사진', '즐겨찾기', '휴지통'] }, // 임시 이미지 삭제 및 원상 복구
        { label: '앨범별', detail: ['인물', '장소', '카테고리'] },
        { label: '백업', detail: ['클라우드 동기화', '저장 공간 관리'] }
      ]
    },
    travel: {
      label: 'Bike Travel',
      icon: <Bike size={32} />, 
      color: 'from-indigo-500 to-purple-400',
      sub: [
        { label: '유라시아 2030', detail: ['루트 설계', '비자 확인', '체크리스트'] },
        { label: '국내 투어', detail: ['경상도 코스', '강원도 코스', '맛집 리스트'] },
        { label: '계획서', detail: ['지출 예산', '숙박 예약', '항공권'] }
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
      label: '등   산',
      icon: <Mountain size={32} />,
      color: 'from-green-500 to-lime-400',
      sub: [
        { label: '등산 기록', detail: ['최근 등반', '누적 고도'] },
        { label: '장비 체크', detail: ['등산화 상태'] }
      ]
    },
    swimming: {
      label: '수   영',
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
    <div className="w-full h-full p-4 flex flex-col bg-transparent text-slate-200 relative overflow-hidden">
      
      {/* 상단 네비게이션: 최상위(Step 0)일 때는 헤더를 비워 Noise 제거 */}
      <div className="flex items-center gap-3 mb-8 relative z-10 min-h-[40px]">
        {step > 0 && (
          <>
            <button 
              onClick={goBack} 
              className="group flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all text-xs font-medium border border-white/10"
            >
              <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> 
              뒤로가기
            </button>
            
            <div className="flex items-center gap-2 ml-2 text-[11px] font-medium text-slate-500">
              <button 
                onClick={() => jumpToStep(0)}
                className="hover:text-indigo-400 transition-colors uppercase tracking-wider"
              >
                유니버스
              </button>

              {path.map((p, i) => (
                <React.Fragment key={i}>
                  <ChevronRight size={12} className="opacity-40" />
                  <button 
                    onClick={() => i === 0 && jumpToStep(1)}
                    className={`transition-colors whitespace-pre ${i === path.length - 1 ? "text-slate-100 font-bold cursor-default" : "hover:text-slate-300 cursor-pointer"}`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 메인 콘텐츠 구역 */}
      <div className="flex-1 relative z-10 overflow-y-auto scrollbar-hide">
        {step === 0 ? (
          /* 1단계: 유니버스 메인 (아이콘 그리드) */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in zoom-in-95 duration-300">
            {Object.keys(menuData).map((key) => (
              <div key={key} className="group flex flex-col items-center justify-center p-3">
                <div 
                  onClick={() => handleMainClick(key)}
                  className={`relative p-4 bg-gradient-to-br ${menuData[key].color} rounded-2xl text-white shadow-lg transition-all duration-500 cursor-pointer 
                  hover:scale-110 hover:rotate-6 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]`}
                >
                   {menuData[key].icon}
                </div>
                <div className="mt-3 text-center">
                  <div className="text-xs font-bold text-slate-300 transition-colors whitespace-pre group-hover:text-white">
                    {menuData[key].label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : step === 1 ? (
          /* 2단계: 서브 메뉴 카드 */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-bottom-5 duration-500">
            {menuData[selectedCategory].sub.map((subItem, idx) => (
              <div 
                key={idx}
                className="group bg-white/5 backdrop-blur-sm border border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl cursor-pointer transition-all hover:bg-white/10"
                onClick={() => handleSubClick(subItem)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-200">{subItem.label}</span>
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${menuData[selectedCategory].color} opacity-20 group-hover:opacity-100 transition-all text-white`}>
                    {React.cloneElement(menuData[selectedCategory].icon,
