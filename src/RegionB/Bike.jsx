import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  MapPin, Flag, ChevronDown, ChevronUp, Plus, Edit2, 
  Trash2, Layers, Save, Paperclip, Calendar, Navigation, AlertTriangle 
} from 'lucide-react';
import { AppContext } from '../App';

// ✅ 상세 지도 뷰 (마우스 우클릭 포인트 지정 및 GPX/KML 관리)
export const BikeRouteFullMapView = ({ title }) => {
  const { BIKE_WORKER_URL, isPrivateMode, adminPassword, popPage } = useContext(AppContext);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mapType, setMapType] = useState('SATELLITE');
  const [routeData, setRouteData] = useState(null);
  const [isMapEngineMissing, setIsMapEngineMissing] = useState(false);
  
  // 마커 상태 관리 (위경도 및 주소 정보)
  const [startNode, setStartNode] = useState(null);
  const [goalNode, setGoalNode] = useState(null);
  const [viaNodes, setViaNodes] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polylineInstance = useRef(null);
  const markersRef = useRef([]);

  // 1. 데이터 로드 (D1 DB에서 가져오기)
  useEffect(() => {
    if (!BIKE_WORKER_URL) return;
    fetch(BIKE_WORKER_URL).then(r => r.json()).then(data => {
      const found = Array.isArray(data) ? data.find(r => r.title === title) : null;
      if (found) {
        const wps = typeof found.waypoints === 'string' ? JSON.parse(found.waypoints || '[]') : found.waypoints || [];
        const path = typeof found.path_data === 'string' ? JSON.parse(found.path_data || '[]') : found.path_data || [];
        setRouteData({ ...found, waypoints: wps, path_data: path });
        
        // 포인트 데이터 분배
        if (wps.length > 0) setStartNode(wps[0]);
        if (wps.length > 1) setGoalNode(wps[wps.length - 1]);
        if (wps.length > 2) setViaNodes(wps.slice(1, -1));
      } else {
        setRouteData({ title, duration: '', distance: '', waypoints: [], memo: '', path_data: [] });
      }
    });
  }, [BIKE_WORKER_URL, title]);

  // 2. 네이버 지도 초기화 및 리사이즈 보정 (🔥 핵심 해결사)
  useEffect(() => {
    if (!mapRef.current) return;
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
      });

      // 🔥 [리사이즈 충격 요법] 렌더링 직후 지도가 0x0으로 기절하는 현상 방지
      setTimeout(() => {
        if (mapInstance.current) {
          window.dispatchEvent(new Event('resize'));
          mapInstance.current.autoResize();
        }
      }, 300);

      // 마우스 우클릭 이벤트 리스너
      window.naver.maps.Event.addListener(mapInstance.current, 'rightclick', e => {
        setContextMenu({ x: e.pointerEvent.clientX, y: e.pointerEvent.clientY, latlng: e.coord });
      });
      window.naver.maps.Event.addListener(mapInstance.current, 'click', () => setContextMenu(null));
    } else {
      mapInstance.current.setMapTypeId(window.naver.maps.MapTypeId[mapType]);
    }
  }, [mapType]);

  // 3. 경로(Polyline) 및 마커 렌더링
  useEffect(() => {
    if (!mapInstance.current || !routeData) return;

    // 경로 그리기 (형광 라임색)
    if (polylineInstance.current) polylineInstance.current.setMap(null);
    if (routeData.path_data?.length > 0) {
      const coords = routeData.path_data.map(p => new window.naver.maps.LatLng(p.lat, p.lng));
      polylineInstance.current = new window.naver.maps.Polyline({
        map: mapInstance.current,
        path: coords,
        strokeColor: '#ccff00',
        strokeWeight: 6,
        strokeOpacity: 0.9,
        strokeLineJoin: 'round'
      });
      const bounds = new window.naver.maps.LatLngBounds();
      coords.forEach(p => bounds.extend(p));
      setTimeout(() => mapInstance.current.fitBounds(bounds, { margin: 50 }), 400);
    }

    // 마커 업데이트
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const drawMarker = (node, type, idx) => {
      if (!node?.lat) return;
      const color = type === 'start' ? '#3b82f6' : type === 'goal' ? '#ef4444' : '#10b981';
      
      // 출발-도착 방위각 화살표 (⬆️)
      let arrowHtml = '';
      if (type === 'start' && startNode && goalNode) {
        const deg = window.naver.maps.LatLng.bearing(
          new window.naver.maps.LatLng(startNode.lat, startNode.lng), 
          new window.naver.maps.LatLng(goalNode.lat, goalNode.lng)
        );
        arrowHtml = `<div style="position:absolute; top:-22px; left:3px; transform:rotate(${Math.round(deg)}deg); text-shadow:0 0 5px black;">⬆️</div>`;
      }

      const m = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(node.lat, node.lng),
        map: mapInstance.current,
        icon: { 
          content: `<div style="position:relative;">${arrowHtml}<div style="background-color:${color}; width:24px; height:24px; border-radius:50%; border:2px solid white; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:900; box-shadow:0 3px 6px rgba(0,0,0,0.5);">${type === 'start' ? '출' : type === 'goal' ? '도' : idx + 1}</div></div>`, 
          anchor: new window.naver.maps.Point(12, 12) 
        }
      });
      markersRef.current.push(m);
    };

    drawMarker(startNode, 'start');
    viaNodes.forEach((v, i) => drawMarker(v, 'via', i));
    drawMarker(goalNode, 'goal');
  }, [routeData, startNode, goalNode, viaNodes]);

  // 우클릭 포인트 지정 핸들러 (역지오코딩 포함)
  const handleSetPoint = async (type) => {
    if (!contextMenu) return;
    const lat = contextMenu.latlng.lat();
    const lng = contextMenu.latlng.lng();
    let address = '지정 위치';
    
    if (window.naver.maps.Service) {
      window.naver.maps.Service.reverseGeocode({ coords: contextMenu.latlng, orders: 'roadaddr,addr' }, (status, res) => {
        if (status === 200 && res.v2) address = res.v2.address.roadAddress || res.v2.address.jibunAddress;
        const node = { address, lat, lng };
        if (type === 'start') setStartNode(node); 
        else if (type === 'goal') setGoalNode(node); 
        else setViaNodes([...viaNodes, node]);
      });
    }
    setContextMenu(null);
  };

  // ✅ GPX/KML 파일 업로드 (누적 방식)
  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const xml = new DOMParser().parseFromString(text, "text/xml");
        const pts = [];
        
        if (file.name.toLowerCase().endsWith('.gpx')) {
          const trks = xml.getElementsByTagName("trkpt");
          for (let i = 0; i < trks.length; i++) {
            pts.push({ lat: parseFloat(trks[i].getAttribute("lat")), lng: parseFloat(trks[i].getAttribute("lon")) });
          }
        } else if (file.name.toLowerCase().endsWith('.kml')) {
          const coords = xml.getElementsByTagName("coordinates")[0]?.textContent.trim().split(/\s+/);
          coords?.forEach(p => { 
            const [ln, lt] = p.split(','); 
            if (lt && ln) pts.push({ lat: parseFloat(lt), lng: parseFloat(ln) }); 
          });
        }
        
        if (pts.length > 0) {
          setRouteData(prev => ({ ...prev, path_data: [...(prev.path_data || []), ...pts] }));
        }
      };
      reader.readAsText(file);
    });
    e.target.value = null; // 초기화
  };

  // 서버 저장
  const handleSave = async () => {
    const payload = { ...routeData, waypoints: [startNode, ...viaNodes, goalNode].filter(Boolean) };
    const res = await fetch(BIKE_WORKER_URL, { 
      method: routeData.id ? 'PUT' : 'POST', 
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword }, 
      body: JSON.stringify(payload) 
    });
    if (res.ok) { alert('투어 코스 저장 완료! 💾'); setIsEditing(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    const res = await fetch(`${BIKE_WORKER_URL}?id=${routeData.id}`, { method: 'DELETE', headers: { 'X-Admin-Password': adminPassword } });
    if (res.ok) { alert("삭제되었습니다."); popPage(); }
  };

  if (!routeData) return <div className="p-10 text-center text-white/50">데이터 교신 중...</div>;

  return (
    <div className="relative flex-1 w-full h-full min-h-[600px] bg-[#0f172a] overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl animate-in fade-in duration-700" onContextMenu={e => e.preventDefault()}>
      <div className="absolute inset-0 z-0" ref={mapRef} />
      
      {isMapEngineMissing && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-black/40 backdrop-blur-sm text-white font-black text-sm">
          지도 엔진 연결 대기 중...
        </div>
      )}
      
      {/* 마커 지정 메뉴 */}
      {contextMenu && isEditing && (
        <div className="fixed z-[9999] bg-slate-900/95 border border-indigo-500/30 rounded-xl flex flex-col w-36 shadow-2xl overflow-hidden" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button onClick={() => handleSetPoint('start')} className="px-4 py-3 text-left text-sm text-white hover:bg-white/10 border-b border-white/5">출발지 지정</button>
          <button onClick={() => handleSetPoint('via')} className="px-4 py-3 text-left text-sm text-white hover:bg-white/10 border-b border-white/5">경유지 추가</button>
          <button onClick={() => handleSetPoint('goal')} className="px-4 py-3 text-left text-sm text-white hover:bg-white/10">도착지 지정</button>
        </div>
      )}

      {/* 우상단 지도 타입 선택 */}
      <div className="absolute top-6 right-6 z-20">
        <button onClick={() => setMapType(p => p === 'NORMAL' ? 'SATELLITE' : 'NORMAL')} className="bg-slate-900/80 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-xl flex items-center gap-2 text-[11px] font-black text-white hover:bg-white/10 shadow-lg">
          <Layers size={14} className="text-indigo-400" /> {mapType === 'NORMAL' ? '위성 지도' : '일반 지도'}
        </button>
      </div>

      {/* 좌상단 롤업 컨트롤 패널 */}
      <div className="absolute top-6 left-6 z-20 flex flex-col pointer-events-none">
        <div className={`pointer-events-auto bg-slate-900/85 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500 overflow-hidden ${isCollapsed ? 'w-48 h-[52px] rounded-xl cursor-pointer' : 'w-[calc(100vw-3rem)] md:w-[26rem] max-h-[85vh] rounded-3xl'}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10" onClick={() => !isEditing && setIsCollapsed(!isCollapsed)} style={{ cursor: isEditing ? 'default' : 'pointer' }}>
            <h2 className={`font-black text-white truncate transition-all ${isCollapsed ? 'text-sm' : 'text-xl'}`}>{routeData.title}</h2>
            <div className="flex items-center gap-2">
              {isPrivateMode && !isCollapsed && !isEditing && (
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={handleDelete} className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg"><Trash2 size={14} className="text-red-400"/></button>
                  <button onClick={() => setIsEditing(true)} className="p-2 bg-white/5 border border-white/10 rounded-lg"><Edit2 size={14} className="text-slate-300"/></button>
                </div>
              )}
              {!isEditing && (isCollapsed ? <ChevronDown size={16} className="text-white"/> : <ChevronUp size={20} className="text-white"/>)}
            </div>
          </div>

          <div className={`flex flex-col gap-4 p-5 transition-all duration-500 ${isCollapsed ? 'opacity-0 h-0 p-0' : 'opacity-100'}`}>
            {isEditing ? (
              <>
                <div className="flex gap-3">
                  <input placeholder="0박 0일" value={routeData.duration} onChange={e => setRouteData({...routeData, duration: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none"/>
                  <input placeholder="거리 (km)" value={routeData.distance} onChange={e => setRouteData({...routeData, distance: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none"/>
                </div>
                
                <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-slate-400 font-bold">
                  <div>출발: {startNode?.address || '(미지정)'}</div>
                  <div>경유: {viaNodes.length}곳 지정됨</div>
                  <div>도착: {goalNode?.address || '(미지정)'}</div>
                </div>

                <textarea placeholder="투어 메모" value={routeData.memo} onChange={e => setRouteData({...routeData, memo: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm h-24 text-slate-300 outline-none resize-none" />
                
                <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-4">
                  <label className="text-xs bg-emerald-500/10 px-4 py-2.5 rounded-xl cursor-pointer border border-emerald-500/30 text-emerald-400 font-bold"><Paperclip size={14} className="inline mr-1" /> GPX/KML 파일 선택<input type="file" multiple hidden accept=".gpx,.kml" onChange={handleFileUpload} /></label>
                  <button onClick={handleSave} className="bg-indigo-500 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg">최종 저장</button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex gap-4 text-sm font-black text-indigo-300">
                  <span className="flex items-center gap-1"><Calendar size={14}/> {routeData.duration || '일정 미정'}</span>
                  <span className="flex items-center gap-1"><Navigation size={14}/> {routeData.distance || '0'} km</span>
                </div>
                {routeData.memo && <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-sm text-indigo-100/90 italic leading-relaxed">"{routeData.memo}"</div>}
                {isPrivateMode && <button onClick={() => setIsEditing(true)} className="w-full bg-white/5 border border-white/10 py-3 rounded-xl text-sm font-bold text-slate-300 mt-2 hover:bg-white/10 transition-all">코스 편집 모드</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ 메인 리스트 화면
export default function Bike({ onSelect }) {
  const { BIKE_WORKER_URL, isPrivateMode, adminPassword } = useContext(AppContext);
  const [routes, setRoutes] = useState([]);
  const [newRoute, setNewRoute] = useState('');

  const fetchRoutes = async () => {
    try {
      const res = await fetch(BIKE_WORKER_URL);
      const data = await res.json();
      setRoutes(Array.isArray(data) ? data : []);
    } catch (err) { console.error("목록 로드 실패", err); }
  };

  useEffect(() => { if (BIKE_WORKER_URL) fetchRoutes(); }, [BIKE_WORKER_URL]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newRoute.trim() || !isPrivateMode) return;
    try {
      const res = await fetch(BIKE_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify({ title: newRoute.trim() })
      });
      if (res.ok) { fetchRoutes(); setNewRoute(''); }
    } catch (err) { alert("생성 실패"); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!isPrivateMode || !window.confirm("이 코스를 영구 삭제할까요?")) return;
    const res = await fetch(`${BIKE_WORKER_URL}?id=${id}`, { method: 'DELETE', headers: { 'X-Admin-Password': adminPassword } });
    if (res.ok) fetchRoutes();
  };

  return (
    <div className="flex flex-col gap-5 h-full p-2 animate-in fade-in duration-300">
      {isPrivateMode && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input type="text" value={newRoute} onChange={(e) => setNewRoute(e.target.value)} placeholder="새로운 코스 이름 입력" className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50" />
          <button type="submit" className="bg-indigo-500 p-4 rounded-2xl text-white shadow-lg"><Plus size={24} /></button>
        </form>
      )}
      
      <div className="flex flex-col gap-3 overflow-y-auto flex-1 custom-scrollbar">
        {routes.length === 0 && <p className="text-slate-500 text-center py-10 text-sm font-bold tracking-widest uppercase">No Records Found</p>}
        {routes.map((route, idx) => (
          <div key={idx} onClick={() => onSelect(route.title)} className="group bg-white/5 border border-white/5 hover:border-indigo-500/30 p-5 rounded-2xl cursor-pointer transition-all hover:bg-white/10 flex items-center justify-between">
            <span className="text-slate-100 font-black tracking-wide text-lg">{route.title}</span>
            <div className="flex items-center gap-3">
              {isPrivateMode && <button onClick={(e) => handleDelete(route.id, e)} className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>}
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-400 opacity-20 group-hover:opacity-100 text-white"><MapPin size={18} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
