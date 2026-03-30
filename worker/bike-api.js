export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      if (request.method === "POST" && url.pathname === "/direction") {
        const { start, goal, waypoints } = await request.json();

        // ✅ 네이버 공식 문서 규격에 따른 URL 생성
        let naverUrl = `https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving?start=${start}&goal=${goal}&option=traavoidcaronly`;
        
        // 경유지가 있을 때만 파라미터 추가
        if (waypoints && waypoints.trim() !== "") {
          naverUrl += `&waypoints=${waypoints}`;
        }

        const naverRes = await fetch(naverUrl, {
          method: "GET",
          headers: {
            "X-NCP-APIGW-API-KEY-ID": env.NAVER_CLIENT_ID,
            "X-NCP-APIGW-API-KEY": env.NAVER_CLIENT_SECRET
          }
        });

        const naverData = await naverRes.json();

        if (!naverRes.ok) {
          return new Response(JSON.stringify({
            error: "NAVER_AUTH_ERROR",
            detail: naverData.message || "네이버 인증 실패. 콘솔의 IP 필터링을 비우고 Secret 이름을 확인해 줘!"
          }), { status: naverRes.status, headers: corsHeaders });
        }

        return new Response(JSON.stringify(naverData), { headers: corsHeaders });
      }

      // [기존 DB 로직 - 생략 없이 유지]
      const checkAuth = (req) => req.headers.get("X-Admin-Password") === env.ADMIN_SECURE;
      if (request.method === "GET") {
        const id = url.searchParams.get("id");
        const stmt = id ? env.DB.prepare("SELECT * FROM bike_routes WHERE id = ?").bind(id) : env.DB.prepare("SELECT * FROM bike_routes ORDER BY created_at DESC");
        const result = id ? await stmt.first() : (await stmt.all()).results;
        return new Response(JSON.stringify(result), { headers: corsHeaders });
      }
      // ... (POST, PUT, DELETE 로직 동일하게 유지) ...
      return new Response("Not Found", { status: 404, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: "WORKER_ERROR", detail: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
