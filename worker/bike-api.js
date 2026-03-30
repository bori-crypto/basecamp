/**
 * Basecamp Bike API Worker - 정밀 검수 완료 최종본
 * 1. Naver Directions 15 (이륜차 최적화)
 * 2. Cloudflare D1 Database 연동
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // ✅ 모든 응답에 공통으로 적용될 CORS 헤더
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
      "Content-Type": "application/json"
    };

    // 1. OPTIONS 요청(Preflight) 즉시 처리
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ✅ 2. 네이버 길찾기 API (Directions 15) 프록시
      // 경로가 /direction을 포함하면 실행
      if (request.method === "POST" && url.pathname.includes("direction")) {
        const body = await request.json();
        const { start, goal, waypoints } = body;

        // [정밀 검수] 환경변수 로드 (공백/대소문자 오차 방어)
        const clientId = (env.NAVER_CLIENT_ID || env['Naver_Client ID'] || env.Naver_Client_ID || "").trim();
        const clientSecret = (env.NAVER_CLIENT_SECRET || env['Naver_Client_Secret'] || env.Naver_Client_Secret || "").trim();

        if (!clientId || !clientSecret) {
          return new Response(JSON.stringify({ 
            error: "CONFIG_ERROR", 
            detail: "워커 Secret 설정에 네이버 키가 없습니다. Cloudflare 대시보드를 확인해 주세요." 
          }), { status: 500, headers: corsHeaders });
        }

        // 🔥 [정밀 검수] 반드시 백틱(`) 사용 및 이륜차 옵션(traavoidcaronly) 확인
        let naverApiUrl = `https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving?start=${start}&goal=${goal}&option=traavoidcaronly`;
        
        if (waypoints && waypoints.trim() !== "") {
          // 경유지 파라미터 안전하게 인코딩
          naverApiUrl += `&waypoints=${encodeURIComponent(waypoints)}`;
        }

        const naverRes = await fetch(naverApiUrl, {
          method: "GET",
          headers: {
            "X-NCP-APIGW-API-KEY-ID": clientId,
            "X-NCP-APIGW-API-KEY": clientSecret,
            // 🎯 [정밀 검수] 네이버 콘솔에 등록된 주소와 100% 일치해야 함
            "Referer": "https://bori.pages.dev/"
          }
        });

        const naverData = await naverRes.json();

        if (!naverRes.ok) {
          return new Response(JSON.stringify({
            error: "NAVER_API_ERROR",
            status: naverRes.status,
            detail: naverData.message || naverData.error?.message || "네이버 인증에 실패했습니다."
          }), { status: naverRes.status, headers: corsHeaders });
        }

        return new Response(JSON.stringify(naverData), { headers: corsHeaders });
      }

      // ✅ 3. D1 데이터베이스 로직
      const checkAuth = (req) => req.headers.get("X-Admin-Password") === env.ADMIN_SECURE;

      // GET: 목록 또는 상세조회
      if (request.method === "GET") {
        const id = url.searchParams.get("id");
        if (id) {
          const result = await env.DB.prepare("SELECT * FROM bike_routes WHERE id = ?").bind(id).first();
          return new Response(JSON.stringify(result || {}), { headers: corsHeaders });
        } else {
          const { results } = await env.DB.prepare("SELECT * FROM bike_routes ORDER BY created_at DESC").all();
          return new Response(JSON.stringify(results || []), { headers: corsHeaders });
        }
      }

      // POST: 코스 신규 저장
      if (request.method === "POST") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        const b = await request.json();
        const stmt = env.DB.prepare(
          "INSERT INTO bike_routes (title, waypoints, path_data, memo) VALUES (?, ?, ?, ?)"
        ).bind(
          b.title || "새로운 코스",
          JSON.stringify(b.waypoints || []),
          JSON.stringify(b.path_data || []),
          b.memo || ""
        );
        await stmt.run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // PUT: 코스 수정
      if (request.method === "PUT") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        const b = await request.json();
        const stmt = env.DB.prepare(
          "UPDATE bike_routes SET title=?, waypoints=?, path_data=?, memo=? WHERE id=?"
        ).bind(
          b.title,
          JSON.stringify(b.waypoints || []),
          JSON.stringify(b.path_data || []),
          b.memo || "",
          b.id
        );
        await stmt.run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // DELETE: 코스 삭제
      if (request.method === "DELETE") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        const id = url.searchParams.get("id");
        await env.DB.prepare("DELETE FROM bike_routes WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });

    } catch (err) {
      // 🚨 워커 내부 엔진 에러 발생 시 상세 보고
      return new Response(JSON.stringify({ 
        error: "WORKER_CRASH", 
        message: err.message,
        stack: err.stack
      }), { status: 500, headers: corsHeaders });
    }
  }
};
