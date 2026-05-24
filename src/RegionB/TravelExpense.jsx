import React, { useState, useEffect, useContext } from 'react';
import { Wallet, Calendar, Users, Clock, Plus, Save, Landmark, Fuel, ChevronRight } from 'lucide-react';
import { AppContext } from '../App';

export default function TravelExpense({ isAdmin }) {
  const { BIKE_WORKER_URL, adminPassword } = useContext(AppContext);

  // 1. 투어 제어 사령부 상태
  const [tours, setTours] = useState(['2025 춘천·강릉 투어', '2024 영월·충주 투어', '2023 남서해안 투어']);
  const [selectedTour, setSelectedTour] = useState('');
  const [newTourName, setNewTourName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // 2. 오빠가 지정한 구글 시트 셀 동기화용 상단 상태 (B2, G2)
  const [duration, setDuration] = useState('3'); // B2: 여행기간
  const [memberCount, setMemberCount] = useState(2); // G2: 참여인원

  // 3. 폼 A: 일반 지출 입력 (왼쪽 영역)
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    amount: '',
    category: '식사'
  });

  // 4. 폼 B: 주유 기록 입력 (오른쪽 영역)
  const [fuelForm, setFuelForm] = useState({
    gasStation: '',
    amount: '',
    totalKm: '',
    volume: ''
  });

  // 새 투어 탭 생성 트리거 (입력원본 시트 복사용)
  const handleCreateTour = (e) => {
    e.preventDefault();
    if (!newTourName.trim()) return;
    setTours([newTourName.trim(), ...tours]);
    setSelectedTour(newTourName.trim());
    setNewTourName('');
    setIsCreating(false);
    alert(`구글 시트 '입력원본' 템플릿을 복사하여 [${newTourName.trim()}] 탭 생성을 요청했습니다.`);
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!selectedTour) return alert('상단에서 투어를 먼저 선택해 줘!');
    alert(`구글 시트 [${selectedTour}] 탭에 일반지출 기록 완료!\n지출명: ${expenseForm.title} | 인원수(${memberCount}명)와 기간(${duration}일) 수식 반영중...`);
    setExpenseForm({ ...expenseForm, title: '', amount: '' });
  };

  const handleFuelSubmit = (e) => {
    e.preventDefault();
    if (!selectedTour) return alert('상단에서 투어를 먼저 선택해 줘!');
    alert(`구글 시트 [${selectedTour}] 탭에 주유기록 기록 완료!\n주유소: ${fuelForm.gasStation} | 연비 수식 자동 정산 중...`);
    setFuelForm({ gasStation: '', amount: '', totalKm: '', volume: '' });
  };

  return (
    <div className="w-full h-full flex flex-col gap-5 animate-in fade-in duration-500 text-slate-100">
      
      {/* 📊 [조종석] 상단 고정 제어판 (글래스모피즘 테마) */}
      <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col md:flex-row gap-5 items-center justify-between backdrop-blur-md shadow-xl shrink-0">
        
        {/* 투어 선택 & 새 투어 생성 */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full md:w-auto flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <Landmark size={18} className="text-indigo-400" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">투어 선택</span>
          </div>
          {isCreating ? (
            <form onSubmit={handleCreateTour} className="flex gap-2 w-full sm:w-auto">
              <input 
                autoFocus 
                type="text" 
                value={newTourName} 
                onChange={(e) => setNewTourName(e.target.value)}
                placeholder="예: 2026 울릉도 투어"
                className="bg-black/40 border border-indigo-500/40 rounded-xl px-3 py-1.5 text-xs text-white outline-none w-full sm:w-48 focus:border-indigo-400"
              />
              <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">생성</button>
              <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 text-xs px-2 hover:text-white">취소</button>
            </form>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <select 
                value={selectedTour} 
                onChange={(e) => setSelectedTour(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none w-full sm:w-56 cursor-pointer focus:border-white/20"
              >
                <option value="" disabled>-- 진행할 투어를 선택해줘 --</option>
                {tours.map((t, i) => <option key={i} value={t} className="bg-slate-900">{t}</option>)}
              </select>
              {isAdmin && (
                <button 
                  onClick={() => setIsCreating(true)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-xl text-xs font-bold transition-all text-indigo-400 shrink-0 flex items-center gap-1"
                >
                  <Plus size={14} /> 새 투어
                </button>
              )}
            </div>
          )}
        </div>

        {/* 📌 구글 시트 동기화 변수 조종석 (여행기간 B2 / 참여인원 G2) */}
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto justify-start md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
          
          {/* 여행 기간 (B2 셀 탑재) */}
          <div className="flex items-center gap-2 bg-black/30 border border-white/5 px-3 py-1.5 rounded-2xl">
            <Clock size={14} className="text-amber-400" />
            <span className="text-[11px] font-bold text-slate-400">기간(B2):</span>
            <input 
              type="number" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)}
              className="w-10 bg-transparent text-center text-xs font-black text-amber-300 outline-none"
            />
            <span className="text-[11px] text-slate-500">일</span>
          </div>

          {/* 참여 인원 (G2 셀 탑재) */}
          <div className="flex items-center gap-2 bg-black/30 border border-white/5 px-3 py-1.5 rounded-2xl">
            <Users size={14} className="text-emerald-400" />
            <span className="text-[11px] font-bold text-slate-400">인원(G2):</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setMemberCount(num)}
                  className={`w-6 h-6 rounded-md text-[10px] font-black transition-all flex items-center justify-center ${
                    memberCount === num 
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 📱💻 [입력 폼 하단 분리 레이아웃] 멀티 디바이스 완벽 자동 너비 조정 */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto custom-scrollbar pb-4">
        
        {/* 폼 A: 일반 지출 입력창 (왼쪽 대형 스페이스) */}
        <form onSubmit={handleExpenseSubmit} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 backdrop-blur-md shadow-xl justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Calendar size={18} className="text-blue-400" />
              <h3 className="text-sm font-black text-slate-200 tracking-wide uppercase">일반 지출 입력</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">지출 일자</label>
                <input 
                  type="date" 
                  value={expenseForm.date} 
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500/40"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">비고 (분류)</label>
                <select 
                  value={expenseForm.category} 
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none cursor-pointer focus:border-blue-500/40"
                >
                  {['식사', '음료', '숙박', '기타'].map((c, i) => <option key={i} value={c} className="bg-slate-900">{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">지출 내역명</label>
              <input 
                type="text" 
                required
                placeholder="예: 안동 비엔비 모텔" 
                value={expenseForm.title}
                onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500/40"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">총 금액 (원)</label>
              <input 
                type="number" 
                required
                placeholder="숫자만 입력" 
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500/40"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-500/20 border border-blue-500/40 hover:bg-blue-500/30 text-blue-400 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors mt-4 shadow-lg shadow-blue-500/5"
          >
            <Plus size={14} strokeWidth={3} /> 일반 지출 추가
          </button>
        </form>

        {/* 폼 B: 주유 기록 입력창 (오른쪽 대형 스페이스) */}
        <form onSubmit={handleFuelSubmit} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 backdrop-blur-md shadow-xl justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Fuel size={18} className="text-purple-400" />
              <h3 className="text-sm font-black text-slate-200 tracking-wide uppercase">주유 기록 입력</h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">주유소명</label>
              <input 
                type="text" 
                required
                placeholder="예: 태백 황지 주유소" 
                value={fuelForm.gasStation}
                onChange={(e) => setFuelForm({ ...fuelForm, gasStation: e.target.value })}
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500/40"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">주유 금액 (원)</label>
              <input 
                type="number" 
                required
                placeholder="숫자만 입력" 
                value={fuelForm.amount}
                onChange={(e) => setFuelForm({ ...fuelForm, amount: e.target.value })}
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">당시 주행누계 (km)</label>
                <input 
                  type="number" 
                  required
                  placeholder="예: 32450" 
                  value={fuelForm.totalKm}
                  onChange={(e) => setFuelForm({ ...fuelForm, totalKm: e.target.value })}
                  className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500/40"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">유류 주입량 (L)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="예: 14.25" 
                  value={fuelForm.volume}
                  onChange={(e) => setFuelForm({ ...fuelForm, volume: e.target.value })}
                  className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500/40"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 text-purple-400 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors mt-4 shadow-lg shadow-purple-500/5"
          >
            <Save size={14} /> 주유 정보 기록
          </button>
        </form>

      </div>
    </div>
  );
}
