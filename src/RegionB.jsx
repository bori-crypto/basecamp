import React, { useState } from 'react';
import { 
  Camera, 
  Plane, 
  Footprints, 
  Fuel, 
  Mountain, 
  Waves, 
  Dumbbell,
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Settings2, 
  LayoutGrid 
} from 'lucide-react';

const RegionB = ({ isAdmin, data }) => {
  // step: 0(유니버스), 1(궤도 진입), 2(탐사 시작)
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [path, setPath] = useState([]);

  // 7개 아이콘 맞춤 데이터 구조 (레이블 공백 및 명칭 엄격 준수)
  const menuData = {
    photos: {
      label: '나의 기록',
      icon: <Camera size={32} />,
      color: 'from-blue-500 to-cyan-400',
      sub: [
        { label: '갤러리', detail: ['최근 사진', '즐겨찾기', '휴지통'] },
        { label: '앨범별', detail: ['인물', '장소', '카테고리'] },
        { label: '백업', detail: ['클라우드 동기화', '저장 공간 관리'] }
      ]
    },
    travel: {
      label: 'Bike Travel',
      icon: <Plane size={32} />,
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
        { label: '장비 관리', detail: ['신발 마일리지', '워치 설정'] },
        { label: '통계', detail: ['페이스 분석', '심박수 구간'] }
      ]
    },
    fuel: {
      label: '주유 기록',
      icon: <Fuel size={32} />,
      color: 'from-orange-500 to-amber-400',
      sub: [
        { label: '주유 기록', detail: ['최근 기록', '누적 금액', '주유소 찾기'] },
        { label: '연비 분석', detail: ['월별 연비', '고속도로 연비'] },
        { label: '차계부', detail: ['소모품 교환', '정비 이력'] }
      ]
    },
    hiking: {
      label: '등    산',
      icon: <Mountain size={32} />,
      color: 'from-green-500 to-lime-400',
      sub: [
        { label: '등산 기록', detail: ['최근 등반', '누적 고도', '등산로 정보'] },
        { label: '장비 체크', detail: ['등산화 상태', '배낭 패킹'] }
      ]
    },
    swimming: {
      label: '수    영',
      icon: <Waves size={32} />,
      color: 'from-sky-500 to-blue-400',
      sub: [
        { label: '수영 일지', detail: ['바퀴 수', '영법 분석'] },
        { label: '기록 갱신', detail: ['50m 단축', '장거리 기록'] }
      ]
    },
    weight: {
      label: '강철 체력',
      icon: <Dumbbell size={32} />,
      color: 'from-slate-500 to-gray-400',
      sub: [
        { label: '웨이트', detail: ['3대 측정', '분할 루틴'] },
        { label: '신체 변화', detail: ['골격근량', '체지방률'] }
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

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setPath([path[0]]);
    } else {
      setStep(0);
      setSelectedCategory(null);
      setPath([]);
    }
  };

  return (
    <div className="w-full h-full p-4 flex flex-col bg-transparent text-slate-200 relative overflow-hidden">
      {/* 상단 네비게이션 헤더 */}
      <div className="flex items-center justify-between mb-6 relative z-10 min-h-[40px]">
        <div className="flex items-center gap-3">
          {step > 0 ? (
            <button 
              onClick={goBack} 
              className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all text-xs font-medium border border-white/10"
            >
              <ChevronLeft size={16} /> 뒤로가기
            </button>
          ) : (
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles size={18} />
              <span className="font-bold tracking-tight text-sm uppercase">Roadmap Universe</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 ml-2 text-[11px] font-medium text-slate-500">
            <span className={step === 0 ? "text-indigo-400" : ""}>유니버스</span>
            {path.map((p, i) => (
              <React.Fragment key={i}>
                <ChevronRight size={12} />
                <span className={i === path.length - 1 ? "text-slate-100" : ""}>{p}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-600 tracking-tight">
          <Settings2 size={16} className="cursor-pointer hover:text-indigo-400 transition-colors" />
          <LayoutGrid size={16} className="cursor-pointer hover:text-indigo-400 transition-colors" />
        </div>
      </div>

      {/* 메인 콘텐츠 구역 */}
      <div className="flex-1 relative z-10 overflow-y-auto scrollbar-hide">
        {step === 0 ? (
          /* [수정 완료] 1단계: 7개 아이콘 메인 - 호버 효과 그라데이션 박스에 집중 */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in zoom-in-95 duration-300">
            {Object.keys(menuData).map((key) => (
              <div 
                key={key} 
                className="group flex flex-col items-center justify-center p-3"
              >
                {/* [수정] Icon Wrapper: hover 효과를 여기에 집중시키고 주변 사각형 박스를 제거 */}
                <div 
                  onClick={() => handleMainClick(key)}
                  className={`relative p-4 bg-gradient-to-br ${menuData[key].color} rounded-2xl text-white shadow-lg transition-all duration-500 cursor-pointer 
                  hover:scale-110 hover:rotate-6 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]`}
                >
                   {menuData[key].icon}
                </div>
                <div className="mt-3 text-center">
                  {/* whitespace-pre 클래스로 레이블의 공백을 정확히 유지 */}
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
                    {React.cloneElement(menuData[selectedCategory].icon, { size: 16 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 3단계: 상세 데이터 리스트 */
          <div className="animate-in zoom-in-95 duration-300 h-full">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${menuData[selectedCategory].color} text-white`}>
                  {React.cloneElement(menuData[selectedCategory].icon, { size: 20 })}
                </div>
                <h3 className="text-lg font-bold text-white">{path[1]}</h3>
              </div>
              <div className="space-y-2">
                {menuData[selectedCategory].sub.find(s => s.label === path[1]).detail.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    <span className="text-xs text-slate-300">{item}</span>
                    <ChevronRight size={14} className="text-slate-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionB;
