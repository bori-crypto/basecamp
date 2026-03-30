/**
 * Basecamp Bike API Worker - 최종 완성본
 * 네이버 Directions 15 인증 및 D1 DB 연동 포함
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
      "Content-Type": "application/json"
    };

    // 1. CORS 대응 (Preflight)
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      // ✅ [길찾기 로직] 네이버 Directions 15 호출
      if (request.method === "POST" && url.pathname.includes("direction")) {
        const { start, goal, waypoints } = await request.json();
        
        const clientId = (env.NAVER_CLIENT_ID || "").trim();
        const clientSecret = (env.NAVER_CLIENT_SECRET || "").trim();

        if (!clientId || !clientSecret) {
          return new Response(JSON.stringify({ error: "CONFIG_ERROR", detail: "Secret 키를 확인해 줘!" }), { status: 500, headers: corsHeaders });
        }

        // URL 조립 (이륜차 전용 옵션)
        let naverUrl = `https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving?start=${start}&goal=${goal}&option=traavoidcaronly`;
        if (waypoints) naverUrl += `&waypoints=${encodeURIComponent(waypoints)}`;

        const naverRes = await fetch(naverUrl, {
          method: "GET",
          headers: { 
            "X-NCP-APIGW-API-KEY-ID": clientId, 
            "X-NCP-APIGW-API-KEY": clientSecret,
            // 🔥 [결정적 한 방] 네이버 콘솔에 등록된 대표 주소를 신분증으로 제시
            "Referer": "https://bori.pages.dev/" 
          }
        });

        const data = await naverRes.json();
        if (!naverRes.ok) {
          return new Response(JSON.stringify({ error: "NAVER_FAIL", detail: data.message || "인증 거절" }), { status: naverRes.status, headers: corsHeaders });
        }
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      // ✅ [DB 로직] 데이터베이스 CRUD
      const checkAuth = (req) => req.headers.get("X-Admin-Password") === env.ADMIN_SECURE;

      if (request.method === "GET") {
        const id = url.searchParams.get("id");
        const stmt = id ? env.DB.prepare("SELECT * FROM bike_routes WHERE id = ?").bind(id) : env.DB.prepare("SELECT * FROM bike_routes ORDER BY created_at DESC");
        const results = id ? await stmt.first() : (await stmt.all()).results;
        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      if (request.method === "POST") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });
        const b = await request.json();
        await env.DB.prepare("INSERT INTO bike_routes (title, waypoints, path_data, memo) VALUES (?, ?, ?, ?)").bind(b.title, JSON.stringify(b.waypoints || []), JSON.stringify(b.path_data || []), b.memo || "").run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (request.method === "PUT") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });
        const b = await request.json();
        await env.DB.prepare("UPDATE bike_routes SET title=?, waypoints=?, path_data=?, memo=? WHERE id=?").bind(b.title, JSON.stringify(b.waypoints || []), JSON.stringify(b.path_data || []), b.memo || "", b.id).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (request.method === "DELETE") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });
        await env.DB.prepare("DELETE FROM bike_routes WHERE id=?").bind(url.searchParams.get("id")).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: "CRASH", detail: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
