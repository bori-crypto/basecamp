import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  MapPin, Navigation, Calendar, Flag, ChevronDown,
  ChevronUp, Plus, Edit2, Save, Layers, UploadCloud, AlertTriangle
} from 'lucide-react';
import { AppContext } from '../App';

export const BikeRouteFullMapView = ({ title }) => {
  const { BIKE_WORKER_URL, isPrivateMode, adminPassword } = useContext(AppContext);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mapType, setMapType] = useState('SATELLITE'); 
  const [routeData, setRouteData] = useState(null);
  
  const [tempWaypoints, setTempWaypoints] = useState('');
  
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
          setRouteData({
            ...found,
            waypoints: typeof found.waypoints === 'string' ? JSON.parse(found.waypoints || '[]') : [],
            path_data: typeof found.path_data === 'string' ? JSON.parse(found.path_data || '[]') : []
          });
        } else {
          setRouteData({ title: title, duration: '', distance: '', waypoints: [], memo: '', path_data: [] });
        }
      })
      .catch(err => console.error("DB 로드 실패:", err));
  }, [BIKE_WORKER_URL, title]);

  // ✅ 네이버 지도 초기화 및 방어막 로직
  useEffect(() => {
    if (!mapRef.current || !routeData) return;

    // 네이버 엔진이 거부(null)되었을 경우 실행 차단 (앱 기절 방지)
    if (!window.naver || !window.naver.maps) {
      console.warn("네이버 지도 엔진이 로드되지 않았습니다. (인증 실패 또는 로딩 중)");
      return;
    }

    if (!mapInstance.current) {
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
          strokeColor: '#facc15',
          strokeWeight: 5,
          strokeOpacity: 0.9,
          strokeLineJoin: 'round',
        });

        const bounds = new window.naver.maps.LatLngBounds();
        path.forEach(p => bounds.extend(p));
        mapInstance.current.fitBounds(bounds, { margin: 50 });
      } catch (error) {
        console.error("경로 렌더링 에러:", error);
      }
    }
  }, [routeData]); 

  // ✅ 토글 시에도 방어막
  useEffect(() => {
    if (mapInstance.current && window.naver && window.naver.maps) {
      mapInstance.current.setMapTypeId(window.naver.maps.MapTypeId[mapType]);
    }
  }, [mapType]);

  const handleEditClick = () => {
    setTempWaypoints(routeData.waypoints.join(', '));
    setIsEditing(true);
  };

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
        alert(`GPX 파싱 완료! (좌표 ${newPath.length}개)`);
      } else {
        alert("GPX 파일에서 경로(trkpt)를 찾을 수 없습니다.");
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleSave = async () => {
    try {
      const finalWaypoints = tempWaypoints.split(',').map(s => s.trim()).filter(Boolean);
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

  if (!routeData) return <div className="p-10 text-center text-white/50">GPS 데이터 교신 중...</div>;

  return (
    <div 
      className="relative w-full h-full min-h-[500px] overflow-hidden rounded-[2.5rem] text-
