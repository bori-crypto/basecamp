import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  MapPin, Navigation, Calendar, Flag, ChevronDown,
  ChevronUp, Plus, Edit2, Save, Layers, UploadCloud
} from 'lucide-react';
import { AppContext } from '../App';

export const BikeRouteFullMapView = ({ title }) => {
  // 사령부(App.jsx)에서 무전기와 권한 정보 가져오기
  const { BIKE_WORKER_URL, isPrivateMode, adminPassword } = useContext(AppContext);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mapType, setMapType] = useState('SATELLITE'); // 지도 모드 상태 (SATELLITE or NORMAL)
  const [routeData, setRouteData] = useState(null);
  
  // 지도 객체 담을 그릇
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polylineInstance = useRef(null);

  // 1. D1 DB에서 해당 코스 데이터 불러오기
  useEffect(() => {
    if (!BIKE_WORKER_URL) return;
    fetch(BIKE_WORKER_URL)
      .then(res => res.json())
      .then(data => {
        const found = data.find(r => r.title === title);
        if (found) {
          setRouteData({
            ...found,
            waypoints: typeof found.waypoints === 'string' ? JSON.parse(found.waypoints || '[]') : [],
            path_data: typeof found.path_data === 'string' ? JSON.parse(found.path_data || '[]') : []
          });
        } else {
          // DB에 없는 새 코스면 빈 껍데기 준비
          setRouteData({ title: title, duration: '', distance: '', waypoints: [], memo: '', path_data: [] });
        }
      })
      .catch(err => console.error("DB 로드 실패:", err));
  }, [BIKE_WORKER_URL, title]);

  // 2. 네이버 지도 초기화 및 GPX 경로 렌더링
  useEffect(() => {
    if (!window.naver || !mapRef.current || !routeData) return;

    // 지도 뼈대 만들기
    if (!mapInstance.current) {
      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(36.3504, 127.3845), // 기본 센터 (대전)
        zoom: 7,
        mapTypeId: window.naver.maps.MapTypeId[mapType],
        disableKineticPan: false,
      });
    }

    // 기존 선 지우기
    if (polylineInstance.current) {
      polylineInstance.current.setMap(null);
    }

    // 새로운 GPX 선 그리기
    if (routeData.path_data && routeData.path_data.length > 0) {
      const path = routeData.path_data.map(p => new window.naver.maps.LatLng(p.lat, p.lng));
      polylineInstance.current = new window.naver.maps.Polyline({
        map: mapInstance.current,
        path: path,
        strokeColor: '#facc15', // 노란색 (위성 지도에서 제일 잘 보임)
        strokeWeight: 5,
        strokeOpacity: 0.9,
        strokeLineJoin: 'round',
      });

      // 경로가 한눈에 보이게 줌/이동
      const bounds = new window.naver.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      mapInstance.current.fitBounds(bounds, { margin: 50 });
    }
  }, [routeData]); // routeData가 바뀔 때마다 실행 (mapType은 제외, 아래서 따로 처리)

  // 3. 위성/일반 지도 토글 처리
  useEffect(() => {
    if (mapInstance.current && window.naver) {
      mapInstance.current.setMapTypeId(window.naver.maps.MapTypeId[mapType]);
    }
  }, [mapType]);

  // 4. GPX 드래그 앤 드롭 업로드 파싱 로직
  const handleDrop = (e) => {
    e.preventDefault();
    if (!isEditing) return;

    const file = e.dataTransfer.files[0];
    if (!file || !file.name.toLowerCase().endsWith('.gpx')) {
      alert("GPX 파일만 업로드 가능합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const trkpts = xmlDoc.getElementsByTagName("trkpt");
      
      const newPath = [];
      for (let i = 0; i < trkpts.length; i++) {
        const lat = parseFloat(trkpts[i].getAttribute("lat"));
        const lon = parseFloat(trkpts[i].getAttribute("lon"));
        newPath.push({ lat, lng: lon });
      }

      if (newPath.length > 0) {
        setRouteData(prev => ({ ...prev, path_data: newPath }));
        alert(`GPX 파일 파싱 완료! (좌표 ${newPath.length}개)`);
      } else {
        alert("GPX 파일에서 경로(trkpt)를 찾을 수 없습니다.");
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => e.preventDefault();

  // 5. 변경사항 D1 DB에 저장 로직
  const handleSave = async () => {
    try {
      const method = routeData.id ? 'PUT' : 'POST';
      const res = await fetch(BIKE_WORKER_URL, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify(routeData)
      });
      if (res.ok) {
        alert('저장 완료! 💾');
        setIsEditing(false);
      } else {
        alert('저장 실패 (권한 부족)');
      }
    } catch (e) {
      alert('네트워크 에러 발생!');
    }
  };

  if (!routeData) return <div className="p-10 text-center text-white/50">GPS 데이터 교신 중...</div>;

  return (
    <div 
      className="relative w-full h-full min-h-[500px] overflow-hidden rounded-[2.5rem] text-slate-100 animate-in fade-in duration-700 font-sans shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* 진짜 네이버 지도가 그려질 배경 (기존 가짜 SVG 삭제) */}
      <div className="absolute inset-0 bg-slate-900 z-0" ref={mapRef} />

      {/* GPX 드래그 안내 오버레이 (수정 모드일 때만) */}
      {isEditing && (
        <div className="absolute inset-0 z-[5] pointer-events-none flex items-center justify-center bg-black/20 backdrop-blur-[2px] border-4 border-dashed border-indigo-500/50 rounded-[2.5rem] m-2">
          <div className="bg-slate-900/80 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl">
            <UploadCloud className="text-indigo-400" size={24} />
            <span className="font-bold text-white tracking-widest text-sm">GPX 파일을 이 화면에 던지세요 (Drag & Drop)</span>
          </div>
        </div>
      )}

      {/* 우측 상단 컨트롤 패널 (지도 토글 & 저장) */}
      <div className="absolute top-6 right-6 z-20 flex gap-2">
        <button 
          onClick={() => setMapType(prev => prev === 'NORMAL' ? 'SATELLITE' : 'NORMAL')}
          className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-white hover:bg-white/10 transition-colors shadow-lg"
        >
          <Layers size={14} className="text-indigo-400" />
          {mapType === 'NORMAL' ? '위성 지도 보기' : '일반 도로 보기'}
        </button>
        {isPrivateMode && (
          <button 
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-wider transition-colors shadow-lg border backdrop-blur-md ${isEditing ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30' : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/30'}`}
          >
            {isEditing ? <><Save size={14} /> 저장하기</> : <><Edit2 size={14} /> 코스 수정</>}
          </button>
        )}
      </div>

      {/* 좌측 상단 미션 브리핑 정보창 (오빠의 원본 UI 100% 유지) */}
      <div className="relative z-10 p-6 h-full pointer-events-none">
        <div className={`w-full max-w-[270px] bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-5 shadow-2xl pointer-events-auto transition-all duration-500 ${isCollapsed ? 'max-h-24' : 'max-h-[90%] overflow-y-auto custom-scrollbar'}`}>
          <div className="cursor-pointer select-none" onClick={() => !isEditing && setIsCollapsed(!isCollapsed)}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <div className="mt-1 p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                  <MapPin className="text-indigo-400" size={16} />
                </div>
                <div>
                  {isEditing ? (
                    <input autoFocus value={routeData.title} onChange={e => setRouteData({...routeData, title: e.target.value})} className="bg-black/50 border border-white/20 text-lg font-black tracking-tighter text-white uppercase leading-tight w-full p-1 rounded outline-none" />
                  ) : (
                    <h3 className="text-lg font-black tracking-tighter text-white uppercase leading-tight">{routeData.title}</h3>
                  )}
                  <p className="text-[9px] text-indigo-400/70 font-bold tracking-[0.15em] mt-1 uppercase">Mission Brief</p>
                </div>
              </div>
              <div className="text-slate-500 mt-1">{isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</div>
            </div>
          </div>
          
          {!isCollapsed && (
            <div className="mt-5 space-y-5 animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-2 text-[9px] font-black uppercase text-slate-300">
                <div className="bg-white/5 px-2.5 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <Calendar size={12} className="text-indigo-400 shrink-0" />
                  {isEditing ? <input value={routeData.duration} onChange={e => setRouteData({...routeData, duration: e.target.value})} placeholder="0박 0일" className="bg-transparent text-white w-full outline-none" /> : <span>{routeData.duration || '미정'}</span>}
                </div>
                <div className="bg-white/5 px-2.5 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <Navigation size={12} className="text-indigo-400 shrink-0" /> 
                  {isEditing ? <input value={routeData.distance} onChange={e => setRouteData({...routeData, distance: e.target.value})} placeholder="0KM" className="bg-transparent text-white w-full outline-none" /> : <span>{routeData.distance || '미정'}</span>}
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-[9px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-[0.2em] ml-1"><Flag size={12} className="text-indigo-500" /> Waypoints</h4>
                <div className="flex flex-col gap-2 relative ml-1">
                  <div className="absolute left-[11px] top-3 bottom-3 w-[1px] bg-indigo-500/20" />
                  {isEditing ? (
                    <textarea 
                      value={routeData.waypoints.join(', ')} 
                      onChange={e => setRouteData({...routeData, waypoints: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                      placeholder="쉼표(,)로 구분해 입력 (예: 해인사, 독일마을)"
                      className="relative z-10 w-full bg-black/50 border border-white/20 text-xs font-bold text-slate-300 p-2 rounded-xl outline-none resize-none h-24"
                    />
                  ) : (
                    routeData.waypoints.map((point, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="relative z-10 w-6 h-6 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-[8px] font-black text-indigo-400 shrink-0">{idx + 1}</div>
                        <span className="text-xs font-bold text-slate-400">{point}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-amber-400/5 border border-amber-400/10 rounded-xl p-3.5">
                {isEditing ? (
                   <textarea value={routeData.memo} onChange={e => setRouteData({...routeData, memo: e.target.value})} placeholder="안전 주의사항 등 메모" className="bg-black/50 w-full text-[10px] text-slate-300 leading-relaxed font-medium italic p-2 rounded outline-none h-20 resize-none" />
                ) : (
                   <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">"{routeData.memo || '메모 없음'}"</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Bike({ step, path, onSelect }) {
  const { BIKE_WORKER_URL, isPrivateMode, adminPassword } = useContext(AppContext);
  const [routes, setRoutes] = useState([]);
  const [newRoute, setNewRoute] = useState('');

  // 2단계 리스트: D1 DB에서 전체 목록 가져오기
  useEffect(() => {
    if (!BIKE_WORKER_URL) return;
    fetch(BIKE_WORKER_URL)
      .then(res => res.json())
      .then(data => setRoutes(data))
      .catch(err => console.error("코스 목록 로드 에러:", err));
  }, [BIKE_WORKER_URL]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newRoute.trim() || !isPrivateMode) return;
    
    // 워커로 POST 날려서 DB에 먼저 생성
    try {
      const res = await fetch(BIKE_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify({ title: newRoute.trim() })
      });
      if (res.ok) {
        // 생성 성공하면 리스트 다시 불러오기
        const updated = await fetch(BIKE_WORKER_URL).then(r => r.json());
        setRoutes(updated);
        setNewRoute('');
      } else {
        alert("코스 생성 실패!");
      }
    } catch (error) {
      alert("통신 에러");
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 h-full">
      {isPrivateMode && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input type="text" value={newRoute} onChange={(e) => setNewRoute(e.target.value)} placeholder="새로운 코스 이름 입력 후 엔터" className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50 transition-all" />
          <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-2xl transition-all shadow-lg"><Plus size={24} /></button>
        </form>
      )}
      
      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pb-4">
        {routes.length === 0 && <p className="text-slate-500 text-center py-10 text-sm font-bold tracking-widest uppercase">No Records Found</p>}
        {routes.map((route, idx) => (
          <div key={idx} onClick={() => onSelect(route.title)} className="group bg-white/5 border border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl cursor-pointer transition-all hover:bg-white/10 flex items-center justify-between shadow-sm hover:shadow-md hover:shadow-indigo-500/10">
            <span className="text-slate-100 font-black tracking-wide">{route.title}</span>
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-400 opacity-20 group-hover:opacity-100 text-white transition-opacity"><MapPin size={16} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
