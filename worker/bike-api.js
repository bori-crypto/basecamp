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
      // ✅ [Directions 15] 이륜차 최적화 경로 탐색
      if (request.method === "POST" && (url.pathname === "/direction" || url.pathname.endsWith("/direction"))) {
        const { start, goal, waypoints } = await request.json();

        // 🚨 환경변수 방어 로직 (대문자, 공백, 언더바 모두 대응)
        const clientId = env.NAVER_CLIENT_ID || env['Naver_Client ID'] || env.Naver_Client_ID;
        const clientSecret = env.NAVER_CLIENT_SECRET || env['Naver_Client_Secret'] || env.Naver_Client_Secret;

        if (!clientId || !clientSecret) {
          return new Response(JSON.stringify({ 
            error: "CONFIG_ERROR", 
            detail: "워커의 Secret 설정이 안 보여! Cloudflare 대시보드에서 'Deploy'를 눌렀는지 확인해 줘." 
          }), { status: 500, headers: corsHeaders });
        }

        // 네이버 공식 이륜차 회피 옵션: traavoidcaronly
        let naverUrl = `https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving?start=${start}&goal=${goal}&option=traavoidcaronly`;
        if (waypoints && waypoints.trim() !== "") {
          naverUrl += `&waypoints=${encodeURIComponent(waypoints)}`;
        }

        const naverRes = await fetch(naverUrl, {
          method: "GET",
          headers: {
            "X-NCP-APIGW-API-KEY-ID": clientId.trim(),
            "X-NCP-APIGW-API-KEY": clientSecret.trim(),
            // 🔥 [결정적 한 방] 네이버에 등록한 주소 중 하나를 Referer로 강제 고정
            "Referer": "https://bori.pages.dev/" 
          }
        });

        const naverData = await naverRes.json();

        if (!naverRes.ok) {
          return new Response(JSON.stringify({
            error: "NAVER_API_ERROR",
            detail: naverData.message || naverData.errorMessage || "인증 거절됨. Client ID/Secret 값을 다시 복사해서 넣어봐!"
          }), { status: naverRes.status, headers: corsHeaders });
        }

        return new Response(JSON.stringify(naverData), { headers: corsHeaders });
      }

      // --- DB CRUD 로직 (생략 없이 유지) ---
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
      return new Response(JSON.stringify({ error: "WORKER_ERROR", detail: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
