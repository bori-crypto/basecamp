import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, Image as ImageIcon } from 'lucide-react';

/**
 * [내부 컴포넌트] SecureImage
 * - Worker를 통해 인증 후 개별 이미지를 로드합니다.
 */
const SecureImage = ({ folder, fileName, alt, className }) => {
  const [imgUrl, setImgUrl] = useState(null);
  const imagePass = import.meta.env.VITE_IMAGE_PASS;
  const workerUrl = "https://basecamp-image-gatekeeper.borimundi.workers.dev";

  useEffect(() => {
    let isMounted = true;
    const fetchImage = async () => {
      if (!fileName) return;
      try {
        // [규격] folder/fileName (예: 2026/photo.jpg)
        const response = await fetch(`${workerUrl}/${folder}/${fileName}`, {
          method: 'GET',
          headers: { "X-Image-Pass": imagePass }
        });

        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          if (isMounted) setImgUrl(objectUrl);
        }
      } catch (err) {
        console.error("이미지 로드 실패:", err);
      }
    };

    fetchImage();
    return () => {
      isMounted = false;
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
  }, [folder, fileName, imagePass]);

  if (!imgUrl) return (
    <div className={`${className} bg-white/5 animate-pulse flex items-center justify-center rounded-xl`}>
      <ImageIcon className="text-white/10 w-8 h-8" />
    </div>
  );

  return (
    <img 
      src={imgUrl} 
      alt={alt} 
      className={`${className} object-cover transition-transform duration-700 group-hover:scale-110`} 
    />
  );
};

const MemoryArchive = ({ selectedSub, isAdmin }) => {
  // R2에서 실시간으로 받아올 목록 상태
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const imagePass = import.meta.env.VITE_IMAGE_PASS;
  const workerUrl = "https://basecamp-image-gatekeeper.borimundi.workers.dev";

  // 확장자 체크 로직 (대소문자 무관)
  const isImageFile = (name) => {
    if (typeof name !== 'string') return false;
    return /\.(jpg|jpeg|png|webp)$/i.test(name);
  };

  /**
   * [핵심 기능] R2 폴더 목록 자동 조회
   * - 컴포넌트가 열릴 때 워커에 접속해 해당 폴더의 파일 리스트를 가져옵니다.
   */
  useEffect(() => {
    const fetchFileList = async () => {
      if (!selectedSub?.label) return;
      setLoading(true);
      try {
        // 워커 주소 끝에 '/'를 붙여 폴더 목록 요청 (예: /2026/)
        const response = await fetch(`${workerUrl}/${selectedSub.label}/`, {
          method: 'GET',
          headers: { "X-Image-Pass": imagePass }
        });

        if (response.ok) {
          const data = await response.json();
          setFileList(data);
        }
      } catch (err) {
        console.error("목록 로드 에러:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFileList();
  }, [selectedSub.label, imagePass]);

  return (
    <div className="w-full py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        
        {loading ? (
          /* 로딩 중 스켈레톤 (오빠가 정한 그리드 유지) */
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 animate-pulse rounded-2xl border border-white/10" />
          ))
        ) : (
          /* R2에서 가져온 실제 파일 목록 렌더링 */
          fileList.map((item, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md border border-white/10
                         transition-all duration-500 cursor-pointer
                         hover:scale-105 hover:rotate-6 hover:border-white/30
                         hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
            >
              {isImageFile(item) ? (
                <div className="aspect-square relative">
                  <SecureImage 
                    folder={selectedSub.label}
                    fileName={item}
                    alt={`Memory-${idx}`}
                    className="w-full h-full"
                  />
                  {isAdmin && (
                    <button className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-md rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ) : (
                /* 혹시 텍스트 파일이 섞여 있을 경우 */
                <div className="p-6 flex flex-col items-center justify-center min-h-[150px] text-center space-y-3">
                  <div className="p-3 bg-white/10 rounded-full">
                    <Sparkles className="text-cyan-400 w-6 h-6" />
                  </div>
                  <span className="text-white/80 font-medium text-sm leading-relaxed">{item}</span>
                </div>
              )}
            </div>
          ))
        )}
        
        {/* 관리자 모드: 사진 추가 버튼 */}
        {isAdmin && (
          <div className="border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center min-h-[150px] hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white/40 text-2xl font-light">+</span>
            </div>
            <span className="text-white/40 text-[10px] mt-2 font-bold tracking-widest uppercase">Add Memory</span>
          </div>
        )}
      </div>

      {/* 목록이 비어있을 때 처리 */}
      {(!loading && fileList.length === 0) && (
        <div className="py-20 text-center">
          <p className="text-white/20 text-sm font-light italic">저장된 기록이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default MemoryArchive;
