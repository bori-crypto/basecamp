-- D1: bike_routes 테이블 구조 정의 (초기화 방지용 IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS bike_routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,          -- 코스명 (예: 울릉도 죽도 한바퀴)
    duration TEXT,                -- 일정 (예: 0박 1일)
    distance TEXT,                -- 총 거리 (예: 약 5KM)
    waypoints TEXT,               -- 주요 지점 (JSON 배열 텍스트로 저장, 예: '["죽도항", "전망대"]')
    memo TEXT,                    -- 메모 (F800GS 공기압 등 주의사항)
    path_data TEXT,               -- ✅ 핵심: 복잡한 GPS 경로(위경도 배열) 전체를 JSON 텍스트로 압축 저장
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- (옵션) 프론트엔드 UI 테스트를 위해 기본 샘플 데이터 1개 삽입
INSERT INTO bike_routes (title, duration, distance, waypoints, memo, path_data)
VALUES (
    'SOUTH COAST 2026',
    '2박 3일',
    '약 450KM',
    '["합천 해인사", "진주 촉석루", "남해 독일마을", "거제 바람의 언덕"]',
    '남해안 해안도로 위주의 와인딩 코스. 노면 상태 주의 및 F800GS 공기압 체크 필수.',
    '[]' -- 아직 GPX 좌표는 없는 빈 배열 상태
);
