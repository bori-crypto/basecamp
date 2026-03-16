import React from 'react';
import { 
  Camera, 
  Plane, 
  Footprints, 
  Fuel, 
  Mountain, 
  Waves, 
  Dumbbell,
  Sparkles
} from 'lucide-react';

const RegionB = () => {
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
        { label: '국내 투어', detail: ['경상도 코스', '강원도 코스', '맛집 리스트'] }
      ]
    },
    running: {
      label: '러닝 기록',
      icon: <Footprints size={32} />,
      color: 'from-emerald-500 to-teal-400',
      sub: [
        { label: '러닝 로그', detail: ['주간 기록', '월간 리포트', '개인 기록'] }
      ]
    },
    fuel: {
      label: '주유 기록',
      icon: <Fuel size={32} />,
      color: 'from-orange-500 to-amber-400',
      sub: [
        { label: '주유 기록', detail: ['최근 기록', '누적 금액', '주유소 찾기'] }
      ]
    },
    hiking: {
      label: '등    산',
      icon: <Mountain size={32} />,
      color: 'from-green-500 to-lime-400',
      sub: [
        { label: '등산 기록', detail: ['최근 등반', '누적 고도'] }
      ]
    },
    swimming: {
      label: '수    영',
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 h-full overflow-y-auto scrollbar-hide animate-in slide-in-from-bottom-5 duration-500 bg-transparent">
      {Object.entries(menuData).map(([key, item]) => (
        <div
          key={key}
          className="group relative flex flex-col items-center justify-center p-4 transition-all duration-300 cursor-pointer rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 animate-in zoom-in-95 duration-300"
        >
          {/* Icon Wrapper: 6도 회전 및 광채 효과 적용 */}
          <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} shadow-lg shadow-black/20 text-white transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]`}>
            {item.icon}
          </div>
          
          {/* Label: 지정된 텍스트 및 공백 반영 */}
          <span className="mt-3 text-sm font-medium text-slate-300 group-hover:text-white transition-colors duration-300 whitespace-pre">
            {item.label}
          </span>

          {/* Sub-label Preview: 호버 시 Sparkles와 함께 등장 */}
          <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-[10px] text-slate-500">
              {item.sub[0].label}
            </span>
            <Sparkles size={10} className="text-amber-400 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default RegionB;
