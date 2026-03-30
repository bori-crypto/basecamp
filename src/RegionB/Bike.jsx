import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  MapPin, Flag, ChevronDown, ChevronUp, Plus, Edit2, 
  Save, Paperclip, Trash2, Layers, AlertTriangle, Route, ArrowUpDown
} from 'lucide-react';
import { AppContext } from '../App';

// ✅ [3단계] 바이크 코스 상세 지도 뷰
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

  const [contextMenu, setContextMenu] = useState(null);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polylineInstance = useRef(null);
  
  // ✅ 실물 마커 객체 보관함
  const markersRef = useRef({ start: null, goal: null, waypoints: [] });
  // ✅ 정밀 좌표(LatLng) 다이렉트 보관함 (오차 방지용 핵심!)
  const coordsRef = useRef({ start: null, goal: null, waypoints: [] });

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

  // 2. 네이버 지도 초기화
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

  useEffect(() => {
    if (mapInstance.current && window.naver && window.naver.maps) {
      mapInstance.current.setMapTypeId(window.naver.maps.MapTypeId[mapType]);
    }
  }, [mapType]);

  // =========================================================
  // ✅ 지오코딩 엔진 및 정밀 마커 관리
  // =========================================================

  const getGeocode = (query) => {
    return new Promise((resolve) => {
      if (!window.naver?.maps?.Service?.geocode) return resolve(null);
      window.naver.maps.Service.geocode({ query }, (status, response) => {
        if (status === window.naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
          const { x, y } = response.v2.addresses[0];
          resolve(new window.naver.maps.LatLng(parseFloat(y), parseFloat(x)));
        } else {
          resolve(null);
        }
      });
    });
  };

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
        } else {
          resolve(`${latlng.lat().toFixed(5)}, ${latlng.lng().toFixed(5)}`);
        }
      });
    });
  };

  // ✅ 지도에 마커를 생성하고, 내부 좌표 메모리(coordsRef)를 강제 동기화
  const updateMarkerAndCoord = (type, latlng, index = 0) => {
    let color = type === 'start' ? '#3b82f6' : type === 'goal' ? '#ef4444' : '#10b981';
    let text = type === 'start' ? '출' : type === 'goal' ? '도' : String(index + 1);
    
    let markerRef = type === 'start' ? markersRef.current.start : 
                    type === 'goal' ? markersRef.current.goal : 
                    markersRef.current.waypoints[index];

    // 정밀 좌표 다이렉트 저장
    if (type === 'start') coordsRef.current.start = latlng;
    else if (type === 'goal') coordsRef.current.goal = latlng;
    else coordsRef.current.waypoints[index] = latlng;

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

      // 마커를 드래그해서 놓았을 때 좌표 갱신 및 주소 역추적
      window.naver.maps.Event.addListener(markerRef, 'dragend', async (e) => {
        const newLatlng = e.coord;
        if (type === 'start') coordsRef.current.start = newLatlng;
        else if (type === 'goal') coordsRef.current.goal = newLatlng;
        else coordsRef.current.waypoints[index] = newLatlng;

        const address = await getAddressFromCoords(newLatlng);
        if (type === 'start') setStartPoint(address);
        else if (type === 'goal') setGoalPoint(address);
        else if (type === 'waypoint') {
          setWaypointPoints(prev => { const newWps = [...prev]; newWps[index] = address; return newWps; });
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

    if (type === 'start') {
      setStartPoint(address);
      updateMarkerAndCoord('start', latlng);
    } else if (type === 'goal') {
      setGoalPoint(address);
      updateMarkerAndCoord('goal', latlng);
    } else if (type === 'waypoint') {
      if (waypointPoints.length < 13) {
        setWaypointPoints([...waypointPoints, address]);
        updateMarkerAndCoord('waypoint', latlng, waypointPoints.length);
      } else {
        alert('경유지는 최대 13개까지만 가능해!');
      }
    }
  };

  const handleSwapPoints = () => {
    const tempPoint = startPoint;
    setStartPoint(goalPoint);
    setGoalPoint(tempPoint);
    
    const tempCoord = coordsRef.current.start;
    coordsRef.current.start = coordsRef.current.goal;
    coordsRef.current.goal = tempCoord;

    if (coordsRef.current.start) updateMarkerAndCoord('start', coordsRef.current.start);
    if (coordsRef.current.goal) updateMarkerAndCoord('goal', coordsRef.current.goal);
  };

  // =========================================================
  // ✅ 1. 길찾기 미리보기 (정밀 좌표 다이렉트 전송)
  // =========================================================
  const handleSearchRoutePreview = async () => {
    if (!startPoint || !goalPoint) {
      alert('출발지와 도착지는 필수야!');
      return;
    }

    setIsRouting(true);
    try {
      // 텍스트를 고쳐 썼을 경우(좌표 캐시 없음) Geocode로 좌표 새로 땀
      let startG = coordsRef.current.start || await getGeocode(startPoint);
      let goalG = coordsRef.current.goal || await getGeocode(goalPoint);

      if (!startG || !goalG) {
        alert('출발지나 도착지 주소를 정확히 찾을 수 없어! 지도 우클릭을 사용해 봐.');
        setIsRouting(false); return;
      }

      // API 전송용 파라미터 조립 (lng, lat)
      const startStr = `${startG.lng()},${startG.lat()}`;
      const goalStr = `${goalG.lng()},${goalG.lat()}`;
      
      const wpsStrs = [];
      const validWpCoords = [];
      for (let i = 0; i < waypointPoints.length; i++) {
        if (waypointPoints[i].trim()) {
          let wpG = coordsRef.current.waypoints[i] || await getGeocode(waypointPoints[i].trim());
          if (wpG) {
            wpsStrs.push(`${wpG.lng()},${wpG.lat()}`);
            validWpCoords.push(wpG);
          }
        }
      }

      const directionUrl = new URL('/direction', BIKE_WORKER_URL).toString();
      const dirRes = await fetch(directionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: startStr, goal: goalStr, waypoints: wpsStrs.join('|') })
      });
      
      const dirData = await dirRes.json();
      
      if (!dirData.route?.traoptimal?.[0]?.path && !dirData.route?.traavoidcaronly?.[0]?.path) {
        alert("이 좌표로는 이륜차 도로 길찾기가 불가능해! 마커를 도로 위로 살짝 옮겨봐.");
        setIsRouting(false);
        return;
      }

      // API 결과에서 이륜차 경로 추출 (traavoidcaronly 우선, 없으면 traoptimal fallback)
      const routePath = dirData.route.traavoidcaronly?.[0]?.path || dirData.route.traoptimal[0].path;
      const newPathData = routePath.map(p => ({ lng: p[0], lat: p[1] }));

      // 지도 위 마커 최신화
      updateMarkerAndCoord('start', startG);
      updateMarkerAndCoord('goal', goalG);
      validWpCoords.forEach((g, idx) => updateMarkerAndCoord('waypoint', g, idx));
      
      markersRef.current.waypoints.forEach((m, idx) => {
        if (idx >= validWpCoords.length) m.setMap(null);
      });
      markersRef.current.waypoints = markersRef.current.waypoints.slice(0, validWpCoords.length);
      coordsRef.current.waypoints = coordsRef.current.waypoints.slice(0, validWpCoords.length);

      const finalWaypoints = [startPoint, ...waypointPoints, goalPoint].filter(Boolean);
      setRouteData(prev => ({ ...prev, waypoints: finalWaypoints, path_data: newPathData }));
      
      alert('이륜차 경로 탐색 완료! 🏍️ 마음에 들면 [저장] 버튼을 눌러줘.');

    } catch (e) {
      console.error("길찾기 실패:", e);
    } finally {
      setIsRouting(false);
    }
  };

  // =========================================================
  // ✅ 2. D1 최종 저장
  // =========================================================
  const handleSave = async () => {
    try {
      const finalWaypoints = [startPoint, ...waypointPoints, goalPoint].filter(Boolean);
      const dataToSave = { ...routeData, waypoints: finalWaypoints };
      
      const res = await fetch(BIKE_WORKER_URL, {
        method: dataToSave.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify(dataToSave)
      });

      if (res.ok) {
        alert('저장 완료! 💾');
        setRouteData(dataToSave);
        setIsEditing(false);
      } else {
        alert('저장 권한이 없어!');
      }
    } catch (e) {
      alert('네트워크 에러 발생!');
    }
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
        const coordinates = xmlDoc.getElementsByTagName("coordinates");
        if (coordinates.length > 0) {
          const coordsText = coordinates[0].textContent.trim();
          coordsText.split(/\s+/).forEach(pair => {
            const [lng, lat] = pair.split(',');
            if (lat && lng) newPath.push({ lat: parseFloat(lat), lng: parseFloat(lng) });
          });
        }
      } else {
        alert("GPX/KML 파일만 지원합니다."); return;
      }

      if (newPath.length > 0) {
        setRouteData(prev => ({ ...prev, path_data: newPath }));
        alert(`파싱 완료! (좌표 ${newPath.length}개) - 수동 저장을 눌러줘!`);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleDeleteDetail = async () => {
    if (!window.confirm("이 코스를 정말 삭제할까?")) return;
    try {
      const res = await fetch(`${BIKE_WORKER_URL}?id=${routeData.id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Password': adminPassword }
      });
      if (res.ok) { alert("삭제 완료"); popPage(); }
    } catch (e) { alert("삭제 실패"); }
  };

  if (!routeData) return <div className="p-10 text-center text-white/50">GPS 데이터 교신 중...</div>;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[2.5rem] text-slate-100 animate-in fade-in duration-700 font-sans shadow-2xl bg-[#0f172a] border border-white/10" onContextMenu={(e) => e.preventDefault()}>
      
      <div className="absolute inset-0 z-0 w-full h-full" ref={mapRef} />

      {contextMenu && isEditing && (
        <div className="fixed z-[9999] bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden w-36 animate-in fade-in zoom-in-95 duration-200" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <div className="px-4 py-2 bg-indigo-500/20 border-b border-indigo-500/30 text-[10px] font-black text-indigo-300 uppercase tracking-widest text-center">포인트 지정</div>
          <button onClick={() => handleSetPointFromMap('start')} className="px-4 py-3 hover:bg-white/10 text-left flex items-center gap-3 text-sm font-bold text-white transition-colors"><MapPin size={16} className="text-blue-400"/> 출발지</button>
          <div className="h-[1px] bg-white/10 w-full" />
          <button onClick={() => handleSetPointFromMap('waypoint')} className="px-4 py-3 hover:bg-white/10 text-left flex items-center gap-3 text-sm font-bold text-white transition-colors">
            {/* 경유지 컨텍스트 메뉴 번호 아이콘화 */}
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white shrink-0"><Plus size={10} /></div> 경유지
          </button>
          <div className="h-[1px] bg-white/10 w-full" />
          <button onClick={() => handleSetPointFromMap('goal')} className="px-4 py-3 hover:bg-white/10 text-left flex items-center gap-3 text-sm font-bold text-white transition-colors"><Flag size={16} className="text-red-400"/> 도착지</button>
        </div>
      )}

      {isMapEngineMissing && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center animate-pulse flex flex-col items-center p-8 bg-slate-900/60 rounded-3xl border border-white/10 shadow-2xl">
            <AlertTriangle size={48} className="mb-4 text-amber-500/80" />
            <p className="text-slate-300 font-black tracking-widest uppercase text-sm">지도 엔진 연결 대기 중...</p>
          </div>
        </div>
      )}

      <div className="absolute top-6 right-6 z-20 flex gap-2">
        <button onClick={() => setMapType(prev => prev === 'NORMAL' ? 'SATELLITE' : 'NORMAL')} className="bg-slate-900/80 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-white hover:bg-white/10 transition-colors shadow-lg">
          <Layers size={14} className="text-indigo-400" /> {mapType === 'NORMAL' ? '위성 지도 보기' : '일반 도로 보기'}
        </button>
      </div>

      <div className="absolute top-6 left-6 z-20 flex flex-col pointer-events-none">
        <div className={`pointer-events-auto bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col transition-all duration-500 overflow-hidden ${isCollapsed ? 'w-48 max-h-[48px] rounded-xl cursor-pointer hover:bg-white/10' : 'w-[calc(100vw-3rem)] md:w-96 max-h-[85vh] rounded-3xl'}`}>
          <div className={`flex items-center justify-between shrink-0 transition-all ${isCollapsed ? 'px-4 py-3 h-[48px]' : 'px-5 py-4 border-b border-white/10'}`} onClick={() => !isEditing && setIsCollapsed(!isCollapsed)} style={{ cursor: isEditing ? 'default' : 'pointer' }}>
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              {isCollapsed && <MapPin size={14} className="text-indigo-400 shrink-0" />}
              {isEditing && !isCollapsed ? (
                <input value={routeData.title} onChange={e => setRouteData({...routeData, title: e.target.value})} className="bg-transparent text-xl font-black outline-none border-b border-indigo-500/50 pb-1 w-full text-white tracking-tight" placeholder="코스명" onClick={e => e.stopPropagation()} />
              ) : (
                <h2 className={`font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 truncate transition-all ${isCollapsed ? 'text-sm' : 'text-xl'}`}>{routeData.title}</h2>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              {isPrivateMode && !isCollapsed && !isEditing && (
                <div className="flex gap-1 mr-1" onClick={e => e.stopPropagation()}>
                  <button onClick={handleDeleteDetail} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 shadow-sm"><Trash2 size={14} className="text-red-400"/></button>
                  <button onClick={() => setIsEditing(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 shadow-sm"><Edit2 size={14} className="text-slate-300"/></button>
                </div>
              )}
              {!isEditing && <button className="text-slate-400 hover:text-white transition-colors">{isCollapsed ? <ChevronDown size={16}/> : <ChevronUp size={20}/>}</button>}
            </div>
          </div>

          <div className={`flex flex-col gap-4 transition-all duration-500 overflow-y-auto custom-scrollbar ${isCollapsed ? 'opacity-0 p-0 m-0 h-0' : 'opacity-100 p-5 pt-4'}`}>
            {isEditing ? (
              <>
                <div className="flex flex-col gap-2 relative">
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-blue-400 shrink-0"/>
                    <input placeholder="출발지 (지도 우클릭)" value={startPoint} onChange={e => { setStartPoint(e.target.value); coordsRef.current.start = null; }} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-white"/>
                  </div>
                  
                  {waypointPoints.map((wp, idx) => (
                    <div key={idx} className="flex items-center gap-3 pl-2 border-l border-white/10 ml-2">
                      {/* ✅ 롤업 UI 경유지 번호 아이콘화 (마커와 동일한 디자인) */}
                      <div className="relative z-10 w-5 h-5 rounded-full bg-emerald-500 border border-white/20 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-md">
                        {idx + 1}
                      </div>
                      <input placeholder={`경유지 ${idx + 1}`} value={wp} onChange={e => { const newWps = [...waypointPoints]; newWps[idx] = e.target.value; setWaypointPoints(newWps); coordsRef.current.waypoints[idx] = null; }} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-white"/>
                      <button onClick={() => setWaypointPoints(waypointPoints.filter((_, i) => i !== idx))} className="text-red-400 p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0"><Trash2 size={16}/></button>
                    </div>
                  ))}

                  <div className="flex justify-center -my-1 relative z-10">
                    <button onClick={handleSwapPoints} className="bg-slate-800 border border-white/20 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-md" title="출발/도착 바꾸기"><ArrowUpDown size={14} /></button>
                  </div>

                  <div className="flex items-center gap-3">
                    <Flag size={18} className="text-red-400 shrink-0"/>
                    <input placeholder="도착지 (지도 우클릭)" value={goalPoint} onChange={e => { setGoalPoint(e.target.value); coordsRef.current.goal = null; }} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-white"/>
                  </div>
                  
                  {waypointPoints.length < 13 && (
                    <button onClick={() => setWaypointPoints([...waypointPoints, ''])} className="mt-1 flex items-center gap-2 text-xs font-bold tracking-wide text-emerald-400 p-2 hover:bg-white/5 rounded-xl transition-colors w-max"><Plus size={14} strokeWidth={3}/> 경유지 추가</button>
                  )}
                </div>

                <button onClick={handleSearchRoutePreview} disabled={isRouting} className="mt-2 w-full bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500/30 disabled:opacity-50 text-emerald-400 font-bold py-3 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2">
                  <Route size={18} /> {isRouting ? '위성 좌표 통신 중...' : '이륜차 최적 길찾기 (미리보기)'}
                </button>

                <textarea placeholder="메모 (노면 상태, 공기압 등)" value={routeData.memo} onChange={e => setRouteData({...routeData, memo: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm h-20 outline-none resize-none mt-2 custom-scrollbar text-slate-300" />

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                  <label className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer border border-white/10 text-slate-200">
                    <Paperclip size={16} className="text-indigo-400"/> 파일 첨부
                    <input type="file" hidden accept=".gpx,.kml" onChange={handleFileUpload} />
                  </label>
                  <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 transition-colors px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 text-white"><Save size={16}/> 저장</button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                {routeData.waypoints?.length > 0 && (
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                    <MapPin size={16} className="text-blue-400 shrink-0"/>
                    <span className="truncate">{routeData.waypoints[0]}</span>
                    <Flag size={16} className="text-red-400 shrink-0 ml-2"/>
                    <span className="truncate">{routeData.waypoints[routeData.waypoints.length - 1]}</span>
                  </div>
                )}
                {routeData.memo && <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-sm text-indigo-100/90 leading-relaxed font-medium italic">"{routeData.memo}"</div>}
              </div>
            )}
          </div>
        </div>
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

  useEffect(() => { if (BIKE_WORKER_URL) fetchRoutes(); }, [BIKE_WORKER_URL]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newRoute.trim() || !isPrivateMode) return;
    try {
      const res = await fetch(BIKE_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify({ title: newRoute.trim(), waypoints: [], path_data: [] })
      });
      if (res.ok) { fetchRoutes(); setNewRoute(''); } 
      else alert("코스 생성 실패!");
    } catch (error) { alert("통신 에러"); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!isPrivateMode || !window.confirm("이 코스를 영구 삭제할까?")) return;
    try {
      const res = await fetch(`${BIKE_WORKER_URL}?id=${id}`, {
        method: 'DELETE', headers: { 'X-Admin-Password': adminPassword }
      });
      if (res.ok) fetchRoutes();
    } catch (err) { alert("삭제 실패"); }
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
                <button onClick={(e) => handleDelete(route.id, e)} className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
              )}
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-400 opacity-20 group-hover:opacity-100 text-white transition-opacity"><MapPin size={16} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
