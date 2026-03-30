import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  MapPin, Navigation, Flag, ChevronDown, 
  ChevronUp, Plus, Edit2, Save, Paperclip, Trash2 
} from 'lucide-react';
import { AppContext } from '../App';

/**
 * [2단계] 바이크 코스 리스트 뷰 (BikeTravel)
 * - 리스트 조회, 새로운 코스 추가, 기존 코스 삭제 담당
 */
export default function BikeTravel({ onSelect, path }) {
  const { BIKE_WORKER_URL, isPrivateMode, adminPassword } = useContext(AppContext);
  const [routes, setRoutes] = useState([]);
  const [newTitle, setNewTitle] = useState('');

  const fetchRoutes = async () => {
    try {
      const res = await fetch(BIKE_WORKER_URL);
      const data = await res.json();
      // 현재 선택된 연도(path[1])가 제목에 포함된 것만 필터링
      const filtered = data.filter(r => r.title.includes(path[1]));
      setRoutes(filtered);
    } catch (e) { console.error("리스트 로드 실패:", e); }
  };

  useEffect(() => { if (BIKE_WORKER_URL) fetchRoutes(); }, [BIKE_WORKER_URL, path]);

  const handleAdd = async () => {
    if (!newTitle.trim() || !isPrivateMode) return;
    try {
      const res = await fetch(BIKE_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify({ title: newTitle, waypoints: [], path_data: [] })
      });
      if (res.ok) {
        setNewTitle('');
        fetchRoutes();
      }
    } catch (e) { alert("추가 실패"); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // 지도 이동 방지
    if (!isPrivateMode || !window.confirm("이 코스를 영구 삭제할까?")) return;
    try {
      const res = await fetch(`${BIKE_WORKER_URL}?id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Password': adminPassword }
      });
      if (res.ok) fetchRoutes();
    } catch (e) { alert("삭제 실패"); }
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      {/* 코스 추가 입력창 (오빠 이미지 UI 재현) */}
      {isPrivateMode && (
        <div className="relative flex items-center">
          <input 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="새로운 코스 이름 입력 후 엔터"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white outline-none focus:border-indigo-500/40 transition-all text-sm"
          />
          <button 
            onClick={handleAdd}
            className="absolute right-2 p-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white shadow-lg transition-colors"
          >
            <Plus size={20}/>
          </button>
        </div>
      )}

      {/* 코스 리스트 */}
      <div className="flex flex-col gap-3">
        {routes.map((route) => (
          <div 
            key={route.id}
            onClick={() => onSelect(route.title)}
            className="group flex items-center justify-between bg-white/5 border border-white/10 p-5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            <span className="text-white font-bold tracking-tight">{route.title}</span>
            <div className="flex items-center gap-2">
              {isPrivateMode && (
                <button 
                  onClick={(e) => handleDelete(route.id, e)}
                  className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={18}/>
                </button>
              )}
              <div className="p-2 bg-white/5 rounded-lg text-slate-500">
                <MapPin size={18}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * [3단계] 바이크 코스 상세 지도 뷰 (BikeRouteFullMapView)
 */
export const BikeRouteFullMapView = ({ title }) => {
  const { BIKE_WORKER_URL, isPrivateMode, adminPassword, popPage } = useContext(AppContext);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mapType, setMapType] = useState('SATELLITE');
  const [routeData, setRouteData] = useState(null);
  
  const [startPoint, setStartPoint] = useState('');
  const [goalPoint, setGoalPoint] = useState('');
  const [waypointPoints, setWaypointPoints] = useState([]);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polylineInstance = useRef(null);

  useEffect(() => {
    if (!BIKE_WORKER_URL) return;
    fetch(BIKE_WORKER_URL)
      .then(res => res.json())
      .then(data => {
        const found = data.find(r => r.title === title);
        if (found) {
          const wps = typeof found.waypoints === 'string' ? JSON.parse(found.waypoints || '[]') : found.waypoints;
          setRouteData({ 
            ...found, 
            waypoints: wps, 
            path_data: typeof found.path_data === 'string' ? JSON.parse(found.path_data || '[]') : found.path_data 
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

  useEffect(() => {
    if (!mapRef.current || !routeData) return;
    if (!window.naver || !window.naver.maps) return;

    if (!mapInstance.current) {
      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(36.3504, 127.3845),
        zoom: 7,
        mapTypeId: window.naver.maps.MapTypeId[mapType],
      });
    }

    if (polylineInstance.current) polylineInstance.current.setMap(null);

    if (routeData.path_data?.length > 0) {
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
  }, [routeData]);

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
      }
      if (newPath.length > 0) setRouteData(prev => ({ ...prev, path_data: newPath }));
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    const finalWaypoints = [startPoint, ...waypointPoints, goalPoint].filter(Boolean);
    const dataToSave = { ...routeData, waypoints: finalWaypoints };
    const res = await fetch(BIKE_WORKER_URL, {
      method: dataToSave.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
      body: JSON.stringify(dataToSave)
    });
    if (res.ok) { alert('저장 완료!'); setIsEditing(false); setRouteData(dataToSave); }
  };

  const handleDeleteDetail = async () => {
    if (!window.confirm("이 코스를 정말 삭제할까?")) return;
    const res = await fetch(`${BIKE_WORKER_URL}?id=${routeData.id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Password': adminPassword }
    });
    if (res.ok) { alert("삭제 완료"); popPage(); }
  };

  if (!routeData) return <div className="p-8 text-white">교신 중...</div>;

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-[2.5rem] bg-[#0f172a]">
      <div ref={mapRef} className="absolute inset-0 z-0" />
      <div className="absolute top-4 left-4 right-4 md:w-96 z-10 flex flex-col gap-3 pointer-events-none">
        <div className="pointer-events-auto flex justify-end">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 shadow-lg">
            {isCollapsed ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}
          </button>
        </div>
        {!isCollapsed && (
          <div className="pointer-events-auto bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white">
            {isEditing ? (
              <>
                <input value={routeData.title} onChange={e => setRouteData({...routeData, title: e.target.value})} className="bg-transparent text-xl font-bold outline-none border-b border-white/20 pb-2 w-full"/>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-3"><MapPin size={18} className="text-blue-400"/><input placeholder="출발지" value={startPoint} onChange={e => setStartPoint(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"/></div>
                  {waypointPoints.map((wp, idx) => (
                    <div key={idx} className="flex items-center gap-3 pl-2 border-l border-white/10 ml-2"><Navigation size={14} className="text-emerald-400"/><input value={wp} onChange={e => {const n=[...waypointPoints]; n[idx]=e.target.value; setWaypointPoints(n);}} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"/><button onClick={() => setWaypointPoints(waypointPoints.filter((_,i)=>i!==idx))} className="text-red-400 p-2"><Trash2 size={16}/></button></div>
                  ))}
                  {waypointPoints.length < 13 && <button onClick={() => setWaypointPoints([...waypointPoints, ''])} className="ml-5 text-xs font-bold text-emerald-400 p-2 hover:bg-white/5 rounded-xl transition-colors w-max"><Plus size={14}/> 경유지 추가</button>}
                  <div className="flex items-center gap-3"><Flag size={18} className="text-red-400"/><input placeholder="도착지" value={goalPoint} onChange={e => setGoalPoint(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"/></div>
                </div>
                <textarea placeholder="메모" value={routeData.memo} onChange={e => setRouteData({...routeData, memo: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm h-20 outline-none resize-none mt-2 custom-scrollbar" />
                <div className="flex justify-between items-center mt-2">
                  <label className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer border border-white/10"><Paperclip size={16} className="text-indigo-400"/> 파일 첨부<input type="file" hidden accept=".gpx,.kml" onChange={handleFileUpload} /></label>
                  <button onClick={handleSave} className="bg-indigo-500 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30"><Save size={16}/> 저장</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">{routeData.title}</h2>
                  {isPrivateMode && (
                    <div className="flex gap-2">
                      <button onClick={handleDeleteDetail} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20"><Trash2 size={16} className="text-red-400"/></button>
                      <button onClick={() => setIsEditing(true)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 shadow-md"><Edit2 size={16} className="text-slate-300"/></button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 mt-1">
                  {routeData.waypoints?.length > 0 && <div className="flex items-center gap-3 text-sm font-medium text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 truncate"><MapPin size={16} className="text-blue-400 shrink-0"/>{routeData.waypoints[0]} <Navigation size={14} className="text-slate-500 mx-1"/> <Flag size={16} className="text-red-400 shrink-0"/>{routeData.waypoints[routeData.waypoints.length-1]}</div>}
                  {routeData.memo && <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-sm text-indigo-100/90 leading-relaxed font-medium">{routeData.memo}</div>}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
