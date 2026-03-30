import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  MapPin, Navigation, Flag, ChevronDown, 
  ChevronUp, Plus, Edit2, Save, Paperclip, Trash2,
  Layers, AlertTriangle, Route, ArrowUpDown
} from 'lucide-react';
import { AppContext } from '../App';

// ✅ [상세 뷰] 바이크 코스 상세 지도 및 편집 컴포넌트
export const BikeRouteFullMapView = ({ title }) => {
  const { BIKE_WORKER_URL, isPrivateMode, adminPassword, popPage } = useContext(AppContext);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mapType, setMapType] = useState('SATELLITE');
  
  const [routeData, setRouteData] = useState(null);
  const [isMapEngineMissing, setIsMapEngineMissing] = useState(false);
  
  const [startPoint, setStartPoint] = useState('');
  const [goalPoint, setGoalPoint] = useState('');
  const [waypointPoints, setWaypointPoints] = useState([]);
  const [isRouting, setIsRouting] = useState(false);

  // ✅ 우클릭 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState(null);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polylineInstance = useRef(null);
  
  // ✅ 실물 마커 및 정밀 좌표(LatLng) 보관함
  const markersRef = useRef({ start: null, goal: null, waypoints: [] });
  const coordsRef = useRef({ start: null, goal: null, waypoints: [] });

  // 1. D1 데이터베이스에서 해당 코스 정보 로드
  useEffect(() => {
    if (!BIKE_WORKER_URL) return;
    fetch(BIKE_WORKER_URL)
      .then(res => res.json())
      .then(data => {
        const found = Array.isArray(data) ? data.find(r => r.title === title) : data;
        if (found) {
          const wps = typeof found.waypoints === 'string' ? JSON.parse(found.waypoints || '[]') : found.waypoints || [];
          const path = typeof found.path_data === 'string' ? JSON.parse(found.path_data || '[]') : found.path_data || [];
          setRouteData({ ...found, waypoints: wps, path_data: path });
          if (wps.length > 0) {
            setStartPoint(wps[0] || '');
            if (wps.length > 1) {
              setGoalPoint(wps[wps.length - 1] || '');
              setWaypointPoints(wps.slice(1, -1));
            }
          }
        } else {
          setRouteData({ title: title, waypoints: [], path_data: [], memo: '' });
        }
      })
      .catch(err => console.error("DB 로드 실패:", err));
  }, [BIKE_WORKER_URL, title]);

  // 2. 네이버 지도 엔진 초기화 및 경로 렌더링
  useEffect(() => {
    if (!mapRef.current || !routeData) return;
    
    if (!window.naver || !window.naver.maps) {
      setIsMapEngineMissing(true);
      return;
    }
    setIsMapEngineMissing(false);

    if (!mapInstance.current || mapRef.current.childNodes.length === 0) {
      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(36.3504, 127.3845),
        zoom: 7,
        mapTypeId: window.naver.maps.MapTypeId[mapType],
        disableKineticPan: false,
      });

      // 마우스 우클릭 및 롱탭(모바일) 이벤트 리스너
      window.naver.maps.Event.addListener(mapInstance.current, 'rightclick', (e) => {
        setContextMenu({ x: e.pointerEvent.clientX, y: e.pointerEvent.clientY, latlng: e.coord });
      });
      window.naver.maps.Event.addListener(mapInstance.current, 'longtap', (e) => {
        setContextMenu({ x: e.pointerEvent.clientX, y: e.pointerEvent.clientY, latlng: e.coord });
      });
      window.naver.maps.Event.addListener(mapInstance.current, 'click', () => {
        setContextMenu(null);
      });
    }

    // 기존 경로 라인 제거 후 새로 그리기
    if (polylineInstance.current) polylineInstance.current.setMap(null);
    if (routeData.path_data?.length > 0 && mapInstance.current) {
      const path = routeData.path_data.map(p => new window.naver.maps.LatLng(p.lat, p.lng));
      polylineInstance.current = new window.naver.maps.Polyline({
        map: mapInstance.current,
        path: path,
        strokeColor: '#ccff00', 
        strokeWeight: 8,
        strokeOpacity: 0.9,
        strokeLineJoin: 'round',
        strokeLineCap: 'round'
      });

      const bounds = new window.naver.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      mapInstance.current.fitBounds(bounds, { margin: 50 });
    }
  }, [routeData, mapType]); 

  // 지도 타입(위성/일반) 변경 감지
  useEffect(() => {
    if (mapInstance.current && window.naver && window.naver.maps) {
      mapInstance.current.setMapTypeId(window.naver.maps.MapTypeId[mapType]);
    }
  }, [mapType]);

  // =========================================================
  // ✅ 기능 함수: 주소 변환 및 마커 제어
  // =========================================================

  // 좌표 ➡️ 주소 변환
  const getAddressFromCoords = (latlng) => {
    return new Promise((resolve) => {
      if (!window.naver?.maps?.Service?.reverseGeocode) {
        resolve(`${latlng.lat().toFixed(5)}, ${latlng.lng().toFixed(5)}`);
        return;
      }
      window.naver.maps.Service.reverseGeocode({
        coords: latlng,
        orders: [window.naver.maps.Service.OrderType.ROAD_ADDR, window.naver.maps.Service.OrderType.ADDR].join(',')
      }, (status, response) => {
        if (status === window.naver.maps.Service.Status.OK && response.v2) {
          const road = response.v2.address.roadAddress;
          const jibun = response.v2.address.jibunAddress;
          resolve(road || jibun || `${latlng.lat().toFixed(5)}, ${latlng.lng().toFixed(5)}`);
        } else resolve(`${latlng.lat().toFixed(5)}, ${latlng.lng().toFixed(5)}`);
      });
    });
  };

  // 지도에 마커 찍기 & 정밀 좌표 저장
  const updateMarkerAndCoord = (type, latlng, index = 0) => {
    let color = type === 'start' ? '#3b82f6' : type === 'goal' ? '#ef4444' : '#10b981';
    let text = type === 'start' ? '출' : type === 'goal' ? '도' : String(index + 1);
    
    if (type === 'start') coordsRef.current.start = latlng;
    else if (type === 'goal') coordsRef.current.goal = latlng;
    else coordsRef.current.waypoints[index] = latlng;

    let markerRef = type === 'start' ? markersRef.current.start : 
                    type === 'goal' ? markersRef.current.goal : 
                    markersRef.current.waypoints[index];

    if (markerRef) {
      markerRef.setPosition(latlng);
    } else {
      markerRef = new window.naver.maps.Marker({
        position: latlng,
        map: mapInstance.current,
        draggable: true,
        icon: {
          content: `<div style="background-color:${color}; width:24px; height:24px; border-radius:50%; border:2px solid white; box-shadow:0 3px 6px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:900;">${text}</div>`,
          anchor: new window.naver.maps.Point(12, 12)
        }
      });

      window.naver.maps.Event.addListener(markerRef, 'dragend', async (e) => {
        const newPos = e.coord;
        if (type === 'start') coordsRef.current.start = newPos;
        else if (type === 'goal') coordsRef.current.goal = newPos;
        else coordsRef.current.waypoints[index] = newPos;

        const address = await getAddressFromCoords(newPos);
        if (type === 'start') setStartPoint(address);
        else if (type === 'goal') setGoalPoint(address);
        else if (type === 'waypoint') {
          setWaypointPoints(prev => { const n = [...prev]; n[index] = address; return n; });
        }
      });

      if (type === 'start') markersRef.current.start = markerRef;
      else if (type === 'goal') markersRef.current.goal = markerRef;
      else markersRef.current.waypoints[index] = markerRef;
    }
  };

  const handleSetPointFromMap = async (type) => {
    if (!contextMenu) return;
    const { latlng } = contextMenu;
    setContextMenu(null); 
    const address = await getAddressFromCoords(latlng);
    if (type === 'start') { setStartPoint(address); updateMarkerAndCoord('start', latlng); }
    else if (type === 'goal') { setGoalPoint(address); updateMarkerAndCoord('goal', latlng); }
    else if (type === 'waypoint') {
      if (waypointPoints.length < 13) {
        setWaypointPoints([...waypointPoints, address]);
        updateMarkerAndCoord('waypoint', latlng, waypointPoints.length);
      } else alert('경유지는 최대 13개까지만 가능해!');
    }
  };

  const handleSwapPoints = () => {
    const tempP = startPoint; setStartPoint(goalPoint); setGoalPoint(tempP);
    const tempC = coordsRef.current.start; coordsRef.current.start = coordsRef.current.goal; coordsRef.current.goal = tempC;
    if (coordsRef.current.start) updateMarkerAndCoord('start', coordsRef.current.start);
    if (coordsRef.current.goal) updateMarkerAndCoord('goal', coordsRef.current.goal);
  };

  // ✅ 1. 바이크 전용 길찾기 미리보기
  const handleSearchRoutePreview = async () => {
    if (!startPoint || !goalPoint) { alert('출발지와 도착지는 필수야!'); return; }
    setIsRouting(true);
    try {
      const sG = coordsRef.current.start;
      const gG = coordsRef.current.goal;
      if (!sG || !gG) { alert('지도에서 지점을 먼저 찍어줘!'); setIsRouting(false); return; }

      const startStr = `${sG.lng().toFixed(6)},${sG.lat().toFixed(6)}`;
      const goalStr = `${gG.lng().toFixed(6)},${gG.lat().toFixed(6)}`;
      const wpsArr = waypointPoints.map((_, i) => coordsRef.current.waypoints[i]).filter(c => c).map(c => `${c.lng().toFixed(6)},${c.lat().toFixed(6)}`).join('|');

      const cleanUrl = BIKE_WORKER_URL.replace(/\/$/, "");
      const res = await fetch(`${cleanUrl}/direction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: startStr, goal: goalStr, waypoints: wpsArr })
      });
      
      const data = await res.json();
      if (!res.ok) {
        alert(`에러: ${data.detail || '인증 실패'}\n워커의 Referer 설정과 네이버 콘솔 설정을 다시 확인해 봐!`);
        setIsRouting(false); return;
      }

      const routePath = data.route.traavoidcaronly?.[0]?.path || data.route.traoptimal?.[0]?.path;
      if (!routePath) { alert("도로를 찾을 수 없어! 마커를 도로 쪽으로 옮겨봐."); setIsRouting(false); return; }

      const newPathData = routePath.map(p => ({ lng: p[0], lat: p[1] }));
      setRouteData(prev => ({ 
        ...prev, 
        waypoints: [startPoint, ...waypointPoints, goalPoint].filter(Boolean), 
        path_data: newPathData 
      }));
      alert('바이크 전용 경로 탐색 성공! 🏍️💨');
    } catch (e) { alert('통신 오류 발생!'); } finally { setIsRouting(false); }
  };

  // ✅ 2. D1 데이터베이스에 최종 저장
  const handleSave = async () => {
    try {
      const finalWps = [startPoint, ...waypointPoints, goalPoint].filter(Boolean);
      const res = await fetch(BIKE_WORKER_URL, {
        method: routeData.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify({ ...routeData, waypoints: finalWps })
      });
      if (res.ok) { alert('저장 완료! 💾'); setIsEditing(false); } 
      else alert('저장 권한이 없어!');
    } catch (e) { alert('네트워크 에러'); }
  };

  const handleDeleteDetail = async () => {
    if (!window.confirm("삭제할까?")) return;
    const res = await fetch(`${BIKE_WORKER_URL}?id=${routeData.id}`, { method: 'DELETE', headers: { 'X-Admin-Password': adminPassword } });
    if (res.ok) { alert("삭제 완료"); popPage(); }
  };

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
          newPath.push({ lat: parseFloat(trkpts[i].getAttribute("lat")), lng: parseFloat(trkpts[i].getAttribute("lon")) });
        }
      } else if (fileName.endsWith('.kml')) {
        const coords = xmlDoc.getElementsByTagName("coordinates");
        if (coords.length > 0) {
          coords[0].textContent.trim().split(/\s+/).forEach(pair => {
            const [lng, lat] = pair.split(',');
            if (lat && lng) newPath.push({ lat: parseFloat(lat), lng: parseFloat(lng) });
          });
        }
      }
      if (newPath.length > 0) {
        setRouteData(prev => ({ ...prev, path_data: newPath }));
        alert(`좌표 ${newPath.length}개 로드 완료!`);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  if (!routeData) return <div className="p-10 text-center text-white/50">데이터 교신 중...</div>;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[2.5rem] text-slate-100 animate-in fade-in duration-700 font-sans shadow-2xl bg-[#0f172a] border border-white/10" onContextMenu={(e) => e.preventDefault()}>
      <div className="absolute inset-0 z-0 w-full h-full" ref={mapRef} />
      
      {contextMenu && isEditing && (
        <div className="fixed z-[9999] bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden w-36 animate-in fade-in zoom-in-95 duration-200" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button onClick={() => { updateMarkerAndCoord('start', contextMenu.latlng); setContextMenu(null); }} className="px-4 py-3 hover:bg-white/10 text-left flex items-center gap-3 text-sm font-bold text-white transition-colors"><MapPin size={16} className="text-blue-400"/> 출발지</button>
          <button onClick={() => { updateMarkerAndCoord('waypoint', contextMenu.latlng, waypointPoints.length); setWaypointPoints([...waypointPoints, '좌표 지정 위치']); setContextMenu(null); }} className="px-4 py-3 hover:bg-white/10 text-left flex items-center gap-3 text-sm font-bold text-white transition-colors"><Plus size={16} className="text-emerald-400"/> 경유지</button>
          <button onClick={() => { updateMarkerAndCoord('goal', contextMenu.latlng); setContextMenu(null); }} className="px-4 py-3 hover:bg-white/10 text-left flex items-center gap-3 text-sm font-bold text-white transition-colors"><Flag size={16} className="text-red-400"/> 도착지</button>
        </div>
      )}

      <div className="absolute top-6 right-6 z-20 flex gap-2">
        <button onClick={() => setMapType(prev => prev === 'NORMAL' ? 'SATELLITE' : 'NORMAL')} className="bg-slate-900/80 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-xl flex items-center gap-2 text-[11px] font-black uppercase text-white hover:bg-white/10 shadow-lg"><Layers size={14} className="text-indigo-400" /> {mapType === 'NORMAL' ? '위성 지도' : '일반 지도'}</button>
      </div>

      <div className="absolute top-6 left-6 z-20 flex flex-col pointer-events-none">
        <div className={`pointer-events-auto bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col transition-all duration-500 overflow-hidden ${isCollapsed ? 'w-48 max-h-[48px] rounded-xl cursor-pointer hover:bg-white/10' : 'w-[calc(100vw-3rem)] md:w-96 max-h-[85vh] rounded-3xl'}`}>
          <div className={`flex items-center justify-between shrink-0 transition-all ${isCollapsed ? 'px-4 py-3 h-[48px]' : 'px-5 py-4 border-b border-white/10'}`} onClick={() => !isEditing && setIsCollapsed(!isCollapsed)} style={{ cursor: isEditing ? 'default' : 'pointer' }}>
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              {isCollapsed && <MapPin size={14} className="text-indigo-400 shrink-0" />}
              {isEditing && !isCollapsed ? <input value={routeData.title} onChange={e => setRouteData({...routeData, title: e.target.value})} className="bg-transparent text-xl font-black outline-none border-b border-indigo-500/50 pb-1 w-full text-white" placeholder="코스명" onClick={e => e.stopPropagation()} /> : <h2 className={`font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 truncate transition-all ${isCollapsed ? 'text-sm' : 'text-xl'}`}>{routeData.title}</h2>}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              {isPrivateMode && !isCollapsed && !isEditing && (
                <div className="flex gap-1 mr-1" onClick={e => e.stopPropagation()}>
                  <button onClick={handleDeleteDetail} className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg shadow-sm"><Trash2 size={14} className="text-red-400"/></button>
                  <button onClick={() => setIsEditing(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 shadow-sm"><Edit2 size={14} className="text-slate-300"/></button>
                </div>
              )}
              {!isEditing && <button className="text-slate-400 hover:text-white transition-colors">{isCollapsed ? <ChevronDown size={16}/> : <ChevronUp size={20}/>}</button>}
            </div>
          </div>

          <div className={`flex flex-col gap-4 transition-all duration-500 overflow-y-auto custom-scrollbar ${isCollapsed ? 'opacity-0 p-0 m-0 h-0' : 'opacity-100 p-5 pt-4'}`}>
            {isEditing ? (
              <>
                <div className="flex flex-col gap-2 relative">
                  <div className="flex items-center gap-3"><MapPin size={18} className="text-blue-400 shrink-0"/><input placeholder="출발지" value={startPoint} readOnly className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"/></div>
                  {waypointPoints.map((wp, i) => (
                    <div key={i} className="flex items-center gap-3 pl-2 border-l border-white/10 ml-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-md">{i + 1}</div>
                      <input value={wp} readOnly className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"/>
                      <button onClick={() => setWaypointPoints(waypointPoints.filter((_, idx) => idx !== i))} className="text-red-400 p-2"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  <div className="flex justify-center -my-1 relative z-10"><button onClick={handleSwapPoints} className="bg-slate-800 border border-white/20 p-1.5 rounded-full text-slate-400 hover:text-white transition-all shadow-md"><ArrowUpDown size={14} /></button></div>
                  <div className="flex items-center gap-3"><Flag size={18} className="text-red-400 shrink-0"/><input placeholder="도착지" value={goalPoint} readOnly className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"/></div>
                  {waypointPoints.length < 13 && <button onClick={() => setWaypointPoints([...waypointPoints, '좌표 지정 전...'])} className="mt-1 text-xs font-bold text-emerald-400 w-max px-2">+ 경유지 추가</button>}
                </div>
                <button onClick={handleSearchRoutePreview} disabled={isRouting} className="mt-2 w-full bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-400 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"><Route size={18} /> {isRouting ? '교신 중...' : '바이크 경로 탐색'}</button>
                <textarea placeholder="메모" value={routeData.memo} onChange={e => setRouteData({...routeData, memo: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm h-20 text-slate-300 resize-none outline-none" />
                <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-4">
                  <label className="text-xs bg-white/10 px-4 py-2.5 rounded-xl cursor-pointer border border-white/10 text-slate-200"><Paperclip size={14} className="inline mr-1" /> GPX/KML<input type="file" hidden accept=".gpx,.kml" onChange={handleFileUpload} /></label>
                  <button onClick={handleSave} className="bg-indigo-500 hover:bg-indigo-600 px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg">최종 저장</button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                {routeData.waypoints?.length > 0 && (
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                    <MapPin size={16} className="text-blue-400 shrink-0"/><span className="truncate">{routeData.waypoints[0]}</span>
                    <Flag size={16} className="text-red-400 shrink-0 ml-1"/><span className="truncate">{routeData.waypoints[routeData.waypoints.length - 1]}</span>
                  </div>
                )}
                {routeData.memo && <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-sm text-indigo-100/90 leading-relaxed font-medium italic">"{routeData.memo}"</div>}
                {isPrivateMode && <button onClick={() => setIsEditing(true)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl text-sm font-bold text-slate-300 mt-2"><Edit2 size={14} className="inline mr-2"/> 편집 모드</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ [리스트 뷰] 바이크 코스 목록 컴포넌트
export default function Bike({ step, path, onSelect }) {
  const { BIKE_WORKER_URL, isPrivateMode, adminPassword } = useContext(AppContext);
  const [routes, setRoutes] = useState([]);
  const [newRoute, setNewRoute] = useState('');

  const fetchRoutes = async () => {
    try {
      const res = await fetch(BIKE_WORKER_URL);
      const data = await res.json();
      setRoutes(Array.isArray(data) ? data : []);
    } catch (err) { console.error("목록 로드 실패:", err); }
  };

  useEffect(() => { if (BIKE_WORKER_URL) fetchRoutes(); }, [BIKE_WORKER_URL]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newRoute.trim() || !isPrivateMode) return;
    try {
      const res = await fetch(BIKE_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify({ title: newRoute.trim(), waypoints: [], path_data: [], memo: "" })
      });
      if (res.ok) { fetchRoutes(); setNewRoute(''); }
    } catch (err) { alert("코스 생성 실패"); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!isPrivateMode || !window.confirm("삭제할까?")) return;
    try {
      const res = await fetch(`${BIKE_WORKER_URL}?id=${id}`, { 
        method: 'DELETE', 
        headers: { 'X-Admin-Password': adminPassword } 
      });
      if (res.ok) fetchRoutes();
    } catch (err) { alert("삭제 실패"); }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 h-full">
      {isPrivateMode && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input type="text" value={newRoute} onChange={(e) => setNewRoute(e.target.value)} placeholder="새로운 코스 이름 입력 후 엔터" className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50 shadow-sm" />
          <button type="submit" className="bg-indigo-500/80 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-lg"><Plus size={24} /></button>
        </form>
      )}
      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pb-4">
        {routes.length === 0 && <p className="text-slate-500 text-center py-10 text-sm font-bold uppercase tracking-widest">No Records Found</p>}
        {routes.map((route, idx) => (
          <div key={idx} onClick={() => onSelect(route.title)} className="group bg-white/5 border border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl cursor-pointer transition-all hover:bg-white/10 flex items-center justify-between shadow-sm">
            <span className="text-slate-100 font-black tracking-wide">{route.title}</span>
            <div className="flex items-center gap-2">
              {isPrivateMode && <button onClick={(e) => handleDelete(route.id, e)} className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>}
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-400 opacity-20 group-hover:opacity-100 text-white"><MapPin size={16} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
