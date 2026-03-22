import React, { useState, useEffect } from 'react';
import { Footprints, Camera, Sparkles, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function GearManagement({ isAdmin, workerUrl, adminPassword }) {
  const [data, setData] = useState({ gear: [], location: [] });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // 폼 데이터 (오빠가 말한 8개 필드 + 계산용 페이스)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    distance: '',
    time: '',
    pace: '',
    heart_rate: '',
    cadence: '',
    location: '',
    gear: '',
    memo: ''
  });

  // 기초 데이터(신발, 장소 목록) 로드
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const res = await fetch(`${workerUrl}`);
        const rawData = await res.json();
        setData({
          gear: rawData.gear || rawData.Gear_Status || [],
          location: rawData.location || rawData.Location_Stats || []
        });
      } catch (e) { console.error("기본 데이터 로드 실패", e); }
    };
    fetchBaseData();
  }, [workerUrl]);

  // 거리와 시간이 바뀔 때마다 페이스 자동 계산
  useEffect(() => {
    if (formData.distance && formData.time) {
      const dist = parseFloat(formData.distance);
      const timeParts = formData.time.split(':').map(Number);
      if (dist > 0 && timeParts.length >= 2) {
        let totalSeconds = 0;
        if (timeParts.length === 3) { // HH:MM:SS
          totalSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
        } else { // MM:SS
          totalSeconds = timeParts[0] * 60 + timeParts[1];
        }
        const pacePerKm = totalSeconds / dist;
        const pMin = Math.floor(pacePerKm / 60);
        const pSec = Math.floor(pacePerKm % 60);
        setFormData(prev => ({ ...prev, pace: `${String(pMin).padStart(2, '0')}:${String(pSec).padStart(2, '0')}` }));
      }
    }
  }, [formData.distance, formData.time]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // ✅ 제미나이 비전 분석 호출 (느긋한 호출 적용)
  const analyzeImage = async () => {
    if (!selectedImage || isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedImage);
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        const res = await fetch(`${workerUrl}/analyze-image`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPassword 
          },
          body: JSON.stringify({ image: base64Data })
        });
        
        const result = await res.json();
        if (result) {
          setFormData(prev => ({
            ...prev,
            date: result.date || prev.date,
            distance: result.distance || prev.distance,
            time: result.time || prev.time,
            heart_rate: result.heart_rate || prev.heart_rate,
            cadence: result.cadence || prev.cadence
          }));
        }
        setIsAnalyzing(false);
      };
    } catch (error) {
      alert("AI 분석 중 오류가 발생했습니다.");
      setIsAnalyzing(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${workerUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('신발 마일리지 기록 성공! 👟');
        setPreviewUrl(null);
        setSelectedImage(null);
      }
    } catch (e) { alert('저장 실패'); }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-white pb-10">
      {/* 사진 업로드 및 미리보기 영역 */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl overflow-hidden relative">
        <div className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-white/10 rounded-2xl relative">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="max-h-64 rounded-xl shadow-2xl" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Camera size={40} />
              <p className="text-xs font-bold uppercase tracking-widest">런닝 스크린샷 선택</p>
            </div>
          )}
          <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
        </div>
        
        {selectedImage && !isAnalyzing && (
          <button onClick={analyzeImage} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
            <Sparkles size={16} /> AI 데이터 추출 시작
          </button>
        )}

        {isAnalyzing && (
          <div className="w-full mt-4 bg-slate-800/50 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 animate-pulse">
            <Loader2 size={16} className="animate-spin" /> 제미나이가 읽는 중...
          </div>
        )}
      </div>

      {/* 데이터 입력 폼 */}
      <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2 text-indigo-400">
          <CheckCircle2 size={18} />
          <h3 className="text-xs font-black uppercase tracking-widest">분석 데이터 확인 및 수동 입력</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">날짜</label>
            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">거리 (km)</label>
            <input type="number" step="0.01" name="distance" value={formData.distance} onChange={handleInputChange} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">시간</label>
            <input type="text" name="time" value={formData.time} onChange={handleInputChange} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none" />
          </div>
          <div className="flex flex-col gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2.5">
            <label className="text-[10px] font-bold text-indigo-400 uppercase">자동 계산 페이스</label>
            <span className="text-xs font-black text-white">{formData.pace || '00:00'} /km</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">심박수 (bpm)</label>
            <input type="number" name="heart_rate" value={formData.heart_rate} onChange={handleInputChange} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">케이던스 (spm)</label>
            <input type="number" name="cadence" value={formData.cadence} onChange={handleInputChange} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 font-['Inter']">장소 선택</label>
            <select name="location" value={formData.location} onChange={handleInputChange} className="bg-slate-900 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none">
              <option value="">장소 선택</option>
              {data.location.map((l, i) => <option key={i} value={l.location}>{l.location}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">신발 선택</label>
            <select name="gear" value={formData.gear} onChange={handleInputChange} className="bg-slate-900 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none">
              <option value="">신발 선택</option>
              {data.gear.map((g, i) => <option key={i} value={g.gear}>{g.gear}</option>)}
            </select>
          </div>
        </div>

        <input type="text" name="memo" placeholder="메모 (신발 상태, 컨디션 등)" value={formData.memo} onChange={handleInputChange} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none mt-2" />

        <button type="submit" className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.3em] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
          최종 기록 저장
        </button>
      </form>
    </div>
  );
}
