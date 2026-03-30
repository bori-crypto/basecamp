import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  MapPin, Navigation, Flag, ChevronDown, 
  ChevronUp, Plus, Edit2, Save, Paperclip, Trash2,
  Layers, AlertTriangle
} from 'lucide-react';
import { AppContext } from '../App';

export const BikeRouteFullMapView = ({ title }) => {
  const { BIKE_WORKER_URL, isPrivateMode, adminPassword, popPage } = useContext(AppContext);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mapType, setMapType] = useState('SATELLITE');
  
  const [routeData, setRouteData] = useState(null);
  const [isMapEngineMissing, setIsMapEngineMissing] = useState(false);
  
  // ✅ 길찾기 폼 상태
  const [startPoint, setStartPoint] = useState('');
  const [goalPoint, setGoalPoint] = useState('');
  const [waypointPoints, setWaypointPoints] = useState([]);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polylineInstance = useRef(null);

  // 1. D1 DB 로드
  useEffect(() => {
    if (!BIKE_WORKER_URL) return;
    fetch(BIKE_WORKER_URL)
      .then(res => res.json())
      .then(data => {
        const found = data.find(r => r.title === title);
        if (found) {
          const wps = typeof found.waypoints === 'string' ? JSON.parse(found.waypoints || '[]') : [];
          setRouteData({ 
            ...found, 
            waypoints: wps, 
            path_data: typeof found.path_data === 'string' ? JSON.parse(found.path_data || '[]') : [] 
          });
          // DB 데이터를 폼에 분배
          if (wps.length > 0) {
            setStartPoint(wps[0] || '');
            if (wps.length > 1) {
              setGoalPoint(wps[wps.length - 1] || '');
              setWaypointPoints(wps.slice(1, -1));
            }
          }
        } else {
          setRouteData({ title: title, duration: '', distance: '', waypoints: [], memo: '', path_data: [] });
        }
      })
      .catch(err => console.error("DB 로드 실패:", err));
  }, [BIKE_WORKER_URL, title]);

  // 2. 네이버 지도 초기화 및 렌더링 (🔥 오빠가 잡아낸 유령 메모리 버그 픽스 복구)
  useEffect(() => {
    if (!mapRef.current || !routeData) return;
    
    if (!window.naver || !window.naver.maps) {
      console.warn("네이버 지도 엔진 연결 대기 중...");
      setIsMapEngineMissing(true);
      return;
    }
    setIsMapEngineMissing(false);

    // ✅ 핵심: DOM 상자가 비어있으면 무조건 새로 그림!
    if (!mapInstance.current || mapRef.current.childNodes.length === 0) {
      try {
        mapInstance.current = new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(36.3504, 127.3845),
          zoom: 7,
          mapTypeId: window.naver.maps.MapTypeId[mapType],
          disableKineticPan: false,
        });
      } catch (error) {
        console.error("네이버 지도 초기화 에러:", error);
      }
    }

    if (polylineInstance.current) {
      polylineInstance.current.setMap(null);
    }

    if (routeData.path_data && routeData.path_data.length > 0 && mapInstance.current) {
      try {
        const path = routeData.path_data.map(p => new window.naver.maps.LatLng(p.lat, p.lng));
        polylineInstance.current = new window.naver.maps.Polyline({
          map: mapInstance.current,
          path: path,
          strokeColor: '#ccff00', // ✅ 형광 라임색 적용
          strokeWeight: 8,        // ✅ 굵기 강화
          strokeOpacity: 0.9,
          strokeLineJoin: 'round',
          strokeLineCap: 'round'
        });

        const bounds = new window.naver.maps.LatLngBounds();
        path.forEach(p => bounds.extend(p));
        mapInstance.current.fitBounds(bounds, { margin: 50 });
      } catch (error) {
        console.error("경로 렌더링 에러:", error);
      }
    }
  }, [routeData, mapType]); 

  useEffect(() => {
    if (mapInstance.current && window.naver && window.naver.maps) {
      mapInstance.current.setMapTypeId(window.naver.maps.MapTypeId[mapType]);
    }
  }, [mapType]);

  // GPX & KML 통합 파일 첨부
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const newPath = [];
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.gpx')) {
        const trkpts = xmlDoc.getElementsByTagName("trkpt");
        for (let i = 0; i < trkpts.length; i++) {
          newPath.push({
            lat: parseFloat(trkpts[i].getAttribute("lat")),
            lng: parseFloat(trkpts[i].getAttribute("lon"))
          });
        }
      } else if (fileName.endsWith('.kml')) {
        const coordinates = xmlDoc.getElementsByTagName("coordinates");
        if (coordinates.length > 0) {
          const coordsText = coordinates[0].textContent.trim();
          const pairs = coordsText.split(/\s+/);
          pairs.forEach(pair => {
            const [lng, lat] = pair.split(',');
            if (lat && lng) newPath.push({ lat: parseFloat(lat), lng: parseFloat(lng) });
          });
        }
      } else {
        alert("GPX 또는 KML 파일만 지원합니다.");
        return;
      }

      if (newPath.length > 0) {
        setRouteData(prev => ({ ...prev, path_data: newPath }));
        alert(`경로 파싱 완료! (좌표 ${newPath.length}개)`);
      } else {
        alert("파일에서 경로를 찾을 수 없습니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleSave = async () => {
    try {
      const finalWaypoints = [startPoint, ...waypointPoints, goalPoint].filter(Boolean);
      const dataToSave = { ...routeData, waypoints: finalWaypoints };
      
      const method = dataToSave.id ? 'PUT' : 'POST';
      const res = await fetch(BIKE_WORKER_URL, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify(dataToSave)
      });

      if (res.ok) {
        alert('저장 완료! 💾');
        setRouteData(dataToSave);
        setIsEditing(false);
      } else {
        alert('저장 실패 (권한 부족)');
      }
    } catch (e) {
      alert('네트워크 에러 발생!');
    }
  };

  const handleDeleteDetail = async () => {
    if (!window.confirm("이 코스를 정말 삭제할까?")) return;
    try {
      const res = await fetch(`${BIKE_WORKER_URL}?id=${routeData.id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Password': adminPassword }
      });
      if (res.ok) { 
        alert("삭제 완료"); 
        popPage(); 
      }
    } catch (e) {
      alert("삭제 실패");
    }
  };

  if (!routeData) return <div className="p-10 text-center text-white/50">GPS 데이터 교신 중...</div>;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[2.5rem] text-slate-100 animate-in fade-in duration-700 font-sans shadow-2xl bg-white/5 backdrop-blur-xl border border-white/10">
      
      {/* ✅ 지도 상자: w-full h-full 강제 주입 복구 완료 */}
      <div className="absolute inset-0 z-0 w-full h-full" ref={mapRef} />

      {isMapEngineMissing && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center animate-pulse flex flex-col items-center p-8 bg-slate-900/60 rounded-3xl border border-white/10 shadow-2xl">
            <AlertTriangle size={48} className="mb-4 text-amber-500/80" />
            <p className="text-slate-300 font-black tracking-widest uppercase text-sm">지도 엔진 연결 대기 중...</p>
            <p className="text-xs text-slate-400 mt-2">네이버 클라우드 API 인증 상태를 확인해 주세요.</p>
          </div>
        </div>
      )}

      {/* 우측 상단 지도 토글 버튼 */}
      <div className="absolute top-6 right-6 z-20 flex gap-2">
        <button 
          onClick={() => setMapType(prev => prev === 'NORMAL' ? 'SATELLITE' : 'NORMAL')}
          className="bg-slate-900/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-white hover:bg-white/10 transition-colors shadow-lg"
        >
          <Layers size={14} className="text-indigo-400" />
          {mapType === 'NORMAL' ? '위성 지도 보기' : '일반 도로 보기'}
        </button>
      </div>

      {/* 둥둥 떠있는 UI 패널 (Glassmorphism) */}
      <div className="absolute top-4 left-4 right-4 md:w-96 z-10 flex flex-col gap-3 pointer-events-none">
        <div className="pointer-events-auto flex justify-end md:hidden">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 shadow-lg">
            {isCollapsed ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}
          </button>
        </div>

        {!isCollapsed && (
          <div className="pointer-events-auto bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white transition-all max-h-[85vh] overflow-y-auto custom-scrollbar">
            {isEditing ? (
              <>
                <input value={routeData.title} onChange={e => setRouteData({...routeData, title: e.target.value})} className="bg-transparent text-xl font-bold outline-none border-b border-white/20 pb-2 w-full" placeholder="코스명"/>
                
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-blue-400 shrink-0"/>
                    <input placeholder="출발지" value={startPoint} onChange={e => setStartPoint(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"/>
                  </div>
                  
                  {waypointPoints.map((wp, idx) => (
                    <div key={idx} className="flex items-center gap-3 pl-2 border-l border-white/10 ml-2">
                      <Navigation size={14} className="text-emerald-400 shrink-0"/>
                      <input placeholder={`경유지 ${idx + 1}`} value={wp} onChange={e => {
                        const newWps = [...waypointPoints];
                        newWps[idx] = e.target.value;
                        setWaypointPoints(newWps);
                      }} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"/>
                      <button onClick={() => setWaypointPoints(waypointPoints.filter((_, i) => i !== idx))} className="text-red-400 p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ))}

                  {waypointPoints.length < 13 && (
                    <button onClick={() => setWaypointPoints([...waypointPoints, ''])} className="ml-5 flex items-center gap-2 text-xs font-bold tracking-wide text-emerald-400 p-2 hover:bg-white/5 rounded-xl transition-colors w-max">
                      <Plus size={14} strokeWidth={3}/> 경유지 추가
                    </button>
                  )}

                  <div className="flex items-center gap-3">
                    <Flag size={18} className="text-red-400 shrink-0"/>
                    <input placeholder="도착지" value={goalPoint} onChange={e => setGoalPoint(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"/>
                  </div>
                </div>

                <textarea placeholder="메모 (노면 상태, 공기압 등)" value={routeData.memo} onChange={e => setRouteData({...routeData, memo: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm h-20 outline-none resize-none mt-2 custom-scrollbar" />

                <div className="flex justify-between items-center mt-2">
                  <label className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer border border-white/10">
                    <Paperclip size={16} className="text-indigo-400"/> 파일 첨부
                    <input type="file" hidden accept=".gpx,.kml" onChange={handleFileUpload} />
                  </label>
                  <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 transition-colors px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30">
                    <Save size={16}/> 저장
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    {routeData.title}
                  </h2>
                  {isPrivateMode && (
                    <div className="flex gap-2">
                      <button onClick={handleDeleteDetail} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20 shadow-md">
                        <Trash2 size={16} className="text-red-400"/>
                      </button>
                      <button onClick={() => setIsEditing(true)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 shadow-md">
                        <Edit2 size={16} className="text-slate-300"/>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 mt-1">
                  {routeData.waypoints?.length > 0 && (
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                      <MapPin size={16} className="text-blue-400 shrink-0"/>
                      <span className="truncate">{routeData.waypoints[0]}</span>
                      <Navigation size={14} className="text-slate-500 shrink-0 mx-1"/>
                      <Flag size={16} className="text-red-400 shrink-0"/>
                      <span className="truncate">{routeData.waypoints[routeData.waypoints.length - 1]}</span>
                    </div>
                  )}

                  {routeData.memo && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-sm text-indigo-100/90 leading-relaxed font-medium">
                      {routeData.memo}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ [2단계] 바이크 코스 리스트 뷰
export default function Bike({ step, path, onSelect }) {
  const { BIKE_WORKER_URL, isPrivateMode, adminPassword } = useContext(AppContext);
  const [routes, setRoutes] = useState([]);
  const [newRoute, setNewRoute] = useState('');

  const fetchRoutes = async () => {
    try {
      const res = await fetch(BIKE_WORKER_URL);
      const data = await res.json();
      setRoutes(data);
    } catch (err) {
      console.error("코스 목록 로드 에러:", err);
    }
  };

  useEffect(() => {
    if (BIKE_WORKER_URL) fetchRoutes();
  }, [BIKE_WORKER_URL]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newRoute.trim() || !isPrivateMode) return;
    
    try {
      const res = await fetch(BIKE_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify({ title: newRoute.trim(), waypoints: [], path_data: [] })
      });
      if (res.ok) {
        fetchRoutes();
        setNewRoute('');
      } else {
        alert("코스 생성 실패!");
      }
    } catch (error) {
      alert("통신 에러");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!isPrivateMode || !window.confirm("이 코스를 영구 삭제할까?")) return;
    try {
      const res = await fetch(`${BIKE_WORKER_URL}?id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Password': adminPassword }
      });
      if (res.ok) fetchRoutes();
    } catch (err) {
      alert("삭제 실패");
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 h-full">
      {isPrivateMode && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input type="text" value={newRoute} onChange={(e) => setNewRoute(e.target.value)} placeholder="새로운 코스 이름 입력 후 엔터" className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50 transition-all shadow-sm" />
          <button type="submit" className="bg-indigo-500/80 backdrop-blur-md hover:bg-indigo-600 border border-white/10 text-white p-4 rounded-2xl transition-all shadow-lg"><Plus size={24} /></button>
        </form>
      )}
      
      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pb-4">
        {routes.length === 0 && <p className="text-slate-500 text-center py-10 text-sm font-bold tracking-widest uppercase">No Records Found</p>}
        {routes.map((route, idx) => (
          <div key={idx} onClick={() => onSelect(route.title)} className="group bg-white/5 backdrop-blur-sm border border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl cursor-pointer transition-all hover:bg-white/10 flex items-center justify-between shadow-sm hover:shadow-md hover:shadow-indigo-500/10">
            <span className="text-slate-100 font-black tracking-wide">{route.title}</span>
            <div className="flex items-center gap-2">
              {isPrivateMode && (
                <button 
                  onClick={(e) => handleDelete(route.id, e)}
                  className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={18}/>
                </button>
              )}
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-400 opacity-20 group-hover:opacity-100 text-white transition-opacity">
                <MapPin size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
