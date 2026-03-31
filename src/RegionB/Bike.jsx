import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  MapPin, Flag, ChevronDown, ChevronUp, Plus, Edit2, 
  Trash2, Layers, Save, Paperclip, Calendar, Navigation, AlertTriangle
} from 'lucide-react';
import { AppContext } from '../App';

// ✅ 상세 지도 및 GPX 관리 뷰
export const BikeRouteFullMapView = ({ title }) => {
  const { BIKE_WORKER_URL, isPrivateMode, adminPassword, popPage } = useContext(AppContext);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mapType, setMapType] = useState('SATELLITE');
  const [routeData, setRouteData] = useState(null);
  const [isMapEngineMissing, setIsMapEngineMissing] = useState(false);
  
  const [startNode, setStartNode] = useState(null);
  const [goalNode, setGoalNode] = useState(null);
  const [viaNodes, setViaNodes] = useState([]);
  
  const [contextMenu, setContextMenu] = useState(null);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polylineInstance = useRef(null);
  const markersRef = useRef([]);

  // 1. DB 데이터 로드 (비동기)
  useEffect(() => {
    if (!BIKE_WORKER_URL) return;
    fetch(BIKE_WORKER_URL)
      .then(res => res.json())
      .then(data => {
        const found = Array.isArray(data) ? data.find(r => r.title === title) : null;
        if (found) {
          const wps = typeof found.waypoints === 'string' ? JSON.parse(found.waypoints || '[]') : found.waypoints || [];
          const path = typeof found.path_data === 'string' ? JSON.parse(found.path_data || '[]') : found.path_data || [];
          
          setRouteData({ ...found, waypoints: wps, path_data: path });
          
          if (wps.length > 0) setStartNode(wps[0]);
          if (wps.length > 1) setGoalNode(wps[wps.length - 1]);
          if (wps.length > 2) setViaNodes(wps.slice(1, -1));
        } else {
          setRouteData({ title: title, duration: '', distance: '', waypoints: [], memo: '', path_data: [] });
        }
      })
      .catch(err => console.error("DB 로드 에러:", err));
  }, [BIKE_WORKER_URL, title]);

  // 2. 지도 초기화 (데이터 유무 상관없이 즉시 렌더링)
  useEffect(() => {
    if (!mapRef.current) return;
    if (!window.naver || !window.naver.maps) {
      setIsMapEngineMissing(true);
      return;
    }
    setIsMapEngineMissing(false);

    if (!mapInstance.current) {
      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(36.3504, 127.3845),
        zoom: 7,
        mapTypeId: window.naver.maps.MapTypeId[mapType],
        disableKineticPan: false,
      });

      window.naver.maps.Event.addListener(mapInstance.current, 'rightclick', (e) => {
        setContextMenu({ x: e.pointerEvent.clientX, y: e.pointerEvent.clientY, latlng: e.coord });
      });
      window.naver.maps.Event.addListener(mapInstance.current, 'click', () => setContextMenu(null));
    } else {
      mapInstance.current.setMapTypeId(window.naver.maps.MapTypeId[mapType]);
    }
  }, [mapType]);

  // 3. 데이터에 기반한 선(GPX)과 마커 렌더링
  useEffect(() => {
    if (!mapInstance.current || !routeData) return;

    // 선 그리기
    if (polylineInstance.current) polylineInstance.current.setMap(null);
    if (routeData.path_data?.length > 0) {
      const pathCoords = routeData.path_data.map(p => new window.naver.maps.LatLng(p.lat, p.lng));
      polylineInstance.current = new window.naver.maps.Polyline({
        map: mapInstance.current,
        path: pathCoords,
        strokeColor: '#ccff00',
        strokeWeight: 6,
        strokeOpacity: 0.9,
        strokeLineJoin: 'round'
      });
      const bounds = new window.naver.maps.LatLngBounds();
      pathCoords.forEach(p => bounds.extend(p));
      mapInstance.current.fitBounds(bounds, { margin: 50 });
    }

    // 마커 그리기
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const drawMarker = (node, type, index) => {
      if (!node || !node.lat) return;
      const color = type === 'start' ? '#3b82f6' : type === 'goal' ? '#ef4444' : '#10b981';
      const text = type === 'start' ? '출' : type === 'goal' ? '도' : String(index + 1);

      let arrowHtml = '';
      if (type === 'start' && startNode?.lat && goalNode?.lat) {
        const sLatlng = new window.naver.maps.LatLng(startNode.lat, startNode.lng);
        const gLatlng = new window.naver.maps.LatLng(goalNode.lat, goalNode.lng);
        const bearing = window.naver.maps.LatLng.bearing(sLatlng, gLatlng);
        arrowHtml = `<div style="position:absolute; top:-22px; left:3px; transform: rotate(${Math.round(bearing)}deg); font-size:16px; text-shadow: 0 0 5px black;">⬆️</div>`;
      }

      const m = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(node.lat, node.lng),
        map: mapInstance.current,
        icon: {
          content: `<div style="position:relative;">${arrowHtml}<div style="background-color:${color}; width:24px; height:24px; border-radius:50%; border:2px solid white; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:900; box-shadow:0 3px 6px rgba(0,0,0,0.5);">${text}</div></div>`,
          anchor: new window.naver.maps.Point(12, 12)
        }
      });
      markersRef.current.push(m);
    };

    drawMarker(startNode, 'start');
    viaNodes.forEach((v, i) => drawMarker(v, 'via', i));
    drawMarker(goalNode, 'goal');

  }, [routeData, startNode, goalNode, viaNodes]);

  // 주소 변환 (Geocoding)
  const getAddress = async (latlng) => {
    return new Promise((resolve) => {
      if (!window.naver.maps.Service) { resolve("지정 위치"); return; }
      window.naver.maps.Service.reverseGeocode({ coords: latlng, orders: 'roadaddr,addr' }, (status, response) => {
        resolve(status === 200 && response.v2 ? (response.v2.address.roadAddress || response.v2.address.jibunAddress) : '지정 위치');
      });
    });
  };

  const handleSetPoint = async (type) => {
    if (!contextMenu) return;
    const addr = await getAddress(contextMenu.latlng);
    const node = { address: addr, lat: contextMenu.latlng.lat(), lng: contextMenu.latlng.lng() };
    setContextMenu(null);

    if (type === 'start') setStartNode(node);
    if (type === 'goal') setGoalNode(node);
    if (type === 'via') setViaNodes([...viaNodes, node]); // 무제한 경유지 누적
  };

  // GPX 멀티 업로드 파싱
  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files.length) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const newPath = [];
        
        if (file.name.toLowerCase().endsWith('.gpx')) {
          const trkpts = xmlDoc.getElementsByTagName("trkpt");
          for (let i = 0; i < trkpts.length; i++) {
            newPath.push({ lat: parseFloat(trkpts[i].getAttribute("lat")), lng: parseFloat(trkpts[i].getAttribute("lon")) });
          }
        } else if (file.name.toLowerCase().endsWith('.kml')) {
          const coords = xmlDoc.getElementsByTagName("coordinates")[0]?.textContent.trim().split(/\s+/);
          coords?.forEach(p => { 
            const [ln, lt] = p.split(','); 
            if (lt && ln) newPath.push({ lat: parseFloat(lt), lng: parseFloat(ln) }); 
          });
        }
        
        if (newPath.length > 0) {
          setRouteData(prev => ({ ...prev, path_data: [...(prev.path_data || []), ...newPath] }));
          alert(`좌표 ${newPath.length}개 추가 완료!`);
        }
      };
      reader.readAsText(file);
    });
    e.target.value = null; 
  };

  const handleSave = async () => {
    try {
      const finalWps = [startNode, ...viaNodes, goalNode].filter(Boolean);
      const payload = { ...routeData, waypoints: finalWps };
      
      const res = await fetch(BIKE_WORKER_URL, {
        method: routeData.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) { 
        alert('저장 완료! 💾'); 
        setIsEditing(false); 
      } else { 
        alert('저장 권한이 없습니다.'); 
      }
    } catch (e) { 
      alert('네트워크 에러 발생'); 
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("이 코스를 영구 삭제할까요?")) return;
    const res = await fetch(`${BIKE_WORKER_URL}?id=${routeData.id}`, { method: 'DELETE', headers: { 'X-Admin-Password': adminPassword } });
    if (res.ok) { alert("삭제 완료"); popPage(); }
  };

  return (
    <div className="relative w-full h-full bg-[#0f172a] overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl" onContextMenu={e => e.preventDefault()}>
      {/* 지도 렌더링 컨테이너 */}
      <div className="absolute inset-0 z-0" ref={mapRef} />

      {isMapEngineMissing && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center animate-pulse flex flex-col items-center p-8 bg-slate-900/60 rounded-3xl border border-white/10 shadow-2xl">
            <AlertTriangle size={48} className="mb-4 text-amber-500/80" />
            <p className="text-slate-300 font-black tracking-widest uppercase text-sm">지도 엔진 연결 대기 중...</p>
          </div>
        </div>
      )}
      
      {/* 우클릭 메뉴 */}
      {contextMenu && isEditing && (
        <div className="fixed z-[9999] bg-slate-900/95 border border-indigo-500/30 rounded-xl flex flex-col w-36 shadow-2xl overflow-hidden" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button onClick={() => handleSetPoint('start')} className="px-4 py-3 text-left text-sm font-bold text-white hover:bg-white/10 flex items-center gap-2"><MapPin size={14} className="text-blue-400"/>출발지</button>
          <button onClick={() => handleSetPoint('via')} className="px-4 py-3 text-left text-sm font-bold text-white hover:bg-white/10 border-y border-white/5 flex items-center gap-2"><Plus size={14} className="text-emerald-400"/>경유지 추가</button>
          <button onClick={() => handleSetPoint('goal')} className="px-4 py-3 text-left text-sm font-bold text-white hover:bg-white/10 flex items-center gap-2"><Flag size={14} className="text-red-400"/>도착지</button>
        </div>
      )}

      <div className="absolute top-6 right-6 z-20 flex gap-2">
        <button onClick={() => setMapType(p => p === 'NORMAL' ? 'SATELLITE' : 'NORMAL')} className="bg-slate-900/80 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-xl flex items-center gap-2 text-[11px] font-black text-white hover:bg-white/10 shadow-lg">
          <Layers size={14} className="text-indigo-400" /> {mapType === 'NORMAL' ? '위성 지도' : '일반 지도'}
        </button>
      </div>

      {/* 롤업 컨트롤 패널 */}
      <div className="absolute top-6 left-6 z-20 flex flex-col pointer-events-none">
        <div className={`pointer-events-auto bg-slate-900/85 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col transition-all duration-500 overflow-hidden ${isCollapsed ? 'w-48 h-[52px] rounded-xl cursor-pointer' : 'w-[calc(100vw-3rem)] md:w-[26rem] max-h-[85vh] rounded-3xl'}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10" onClick={() => !isEditing && setIsCollapsed(!isCollapsed)} style={{ cursor: isEditing ? 'default' : 'pointer' }}>
            <div className="flex-1 overflow-hidden">
              {isEditing && !isCollapsed ? <input value={routeData?.title || ''} onChange={e => setRouteData({...routeData, title: e.target.value})} className="bg-transparent text-xl font-black outline-none border-b border-indigo-500/50 pb-1 w-full text-white" /> : <h2 className={`font-black text-white truncate transition-all ${isCollapsed ? 'text-sm' : 'text-xl'}`}>{routeData?.title}</h2>}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              {isPrivateMode && !isCollapsed && !isEditing && (
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={handleDelete} className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg"><Trash2 size={14} className="text-red-400"/></button>
                  <button onClick={() => setIsEditing(true)} className="p-2 bg-white/5 border border-white/10 rounded-lg"><Edit2 size={14} className="text-slate-300"/></button>
                </div>
              )}
              {!isEditing && <button className="text-slate-400 hover:text-white">{isCollapsed ? <ChevronDown size={16}/> : <ChevronUp size={20}/>}</button>}
            </div>
          </div>

          <div className={`flex flex-col gap-4 overflow-y-auto custom-scrollbar transition-all duration-500 ${isCollapsed ? 'opacity-0 p-0 h-0' : 'opacity-100 p-5'}`}>
            {isEditing ? (
              <>
                <div className="flex gap-3">
                  <input placeholder="일정 (예: 2박 3일)" value={routeData?.duration || ''} onChange={e => setRouteData({...routeData, duration: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"/>
                  <input placeholder="거리 (예: 300km)" value={routeData?.distance || ''} onChange={e => setRouteData({...routeData, distance: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"/>
                </div>
                
                {/* 포인트 편집 리스트 */}
                <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3"><MapPin size={16} className="text-blue-400 shrink-0"/><input value={startNode?.address || ''} placeholder="출발지 (지도 우클릭)" readOnly className="flex-1 bg-transparent text-sm text-white outline-none"/>{startNode && <button onClick={()=>setStartNode(null)} className="text-red-400"><Trash2 size={14}/></button>}</div>
                  {viaNodes.map((v, i) => (
                    <div key={i} className="flex items-center gap-3 pl-1 border-l border-white/10 ml-1.5"><div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] font-black text-white shrink-0">{i + 1}</div><input value={v.address || ''} readOnly className="flex-1 bg-transparent text-sm text-white outline-none"/><button onClick={() => setViaNodes(viaNodes.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 size={14}/></button></div>
                  ))}
                  <div className="flex items-center gap-3"><Flag size={16} className="text-red-400 shrink-0"/><input value={goalNode?.address || ''} placeholder="도착지 (지도 우클릭)" readOnly className="flex-1 bg-transparent text-sm text-white outline-none"/>{goalNode && <button onClick={()=>setGoalNode(null)} className="text-red-400"><Trash2 size={14}/></button>}</div>
                </div>

                <textarea placeholder="메모 (안전 주의사항 등)" value={routeData?.memo || ''} onChange={e => setRouteData({...routeData, memo: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm h-24 text-slate-300 resize-none outline-none" />
                
                <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-4">
                  <label className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2.5 rounded-xl cursor-pointer border border-emerald-500/30 text-emerald-400 font-bold transition-all"><Paperclip size={14} className="inline mr-1" /> GPX 누적 추가<input type="file" multiple hidden accept=".gpx,.kml" onChange={handleFileUpload} /></label>
                  <button onClick={handleSave} className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all">최종 저장</button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 text-sm font-black text-indigo-300">
                  <span className="flex items-center gap-1"><Calendar size={14}/> {routeData?.duration || '일정 미정'}</span>
                  <span className="flex items-center gap-1"><Navigation size={14}/> {routeData?.distance || '거리 미상'}</span>
                </div>
                
                {(startNode || goalNode) && (
                  <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/5 text-sm text-slate-300">
                    {startNode && <div className="flex items-center gap-2"><MapPin size={14} className="text-blue-400 shrink-0"/><span className="truncate">{startNode.address}</span></div>}
                    {viaNodes.length > 0 && <div className="pl-1.5 ml-1.5 border-l border-white/10 text-xs font-bold text-emerald-400">경유지 {viaNodes.length}곳</div>}
                    {goalNode && <div className="flex items-center gap-2"><Flag size={14} className="text-red-400 shrink-0"/><span className="truncate">{goalNode.address}</span></div>}
                  </div>
                )}
                
                {routeData?.memo && <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-sm text-indigo-100/90 leading-relaxed italic">"{routeData.memo}"</div>}
                
                {isPrivateMode && <button onClick={() => setIsEditing(true)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl text-sm font-bold text-slate-300 mt-2 transition-all"><Edit2 size={14} className="inline mr-2"/>코스 편집 모드</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ 메인 리스트 뷰
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
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 h-full p-2">
      {isPrivateMode && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input type="text" value={newRoute} onChange={(e) => setNewRoute(e.target.value)} placeholder="새로운 코스 이름 입력" className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50 shadow-sm" />
          <button type="submit" className="bg-indigo-500/80 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-lg"><Plus size={24} /></button>
        </form>
      )}
      
      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pb-4">
        {routes.length === 0 && <p className="text-slate-500 text-center py-10 text-sm font-bold tracking-widest uppercase">No Records Found</p>}
        {routes.map((route, idx) => (
          <div key={idx} onClick={() => onSelect(route.title)} className="group bg-white/5 border border-white/5 hover:border-indigo-500/30 p-5 rounded-2xl cursor-pointer transition-all hover:bg-white/10 flex items-center justify-between shadow-sm hover:shadow-md hover:shadow-indigo-500/10">
            <span className="text-slate-100 font-black tracking-wide text-lg">{route.title}</span>
            <div className="flex items-center gap-3">
              {isPrivateMode && <button onClick={(e) => handleDelete(route.id, e)} className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>}
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-400 opacity-20 group-hover:opacity-100 text-white transition-opacity"><MapPin size={18} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
