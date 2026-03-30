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
      if (request.method === "POST" && (url.pathname === "/direction" || url.pathname.endsWith("/direction"))) {
        const { start, goal, waypoints } = await request.json();

        // 🚨 환경변수 로드 (공백이나 대소문자 방어 로직)
        const clientId = env.NAVER_CLIENT_ID || env.Naver_Client_ID || env['Naver_Client ID'];
        const clientSecret = env.NAVER_CLIENT_SECRET || env.Naver_Client_Secret || env['Naver_Client Secret'];

        if (!clientId || !clientSecret) {
          return new Response(JSON.stringify({ error: "CONFIG_ERROR", detail: "Cloudflare Secret 키를 찾을 수 없어! 대소문자와 공백을 확인해 줘." }), { status: 500, headers: corsHeaders });
        }

        // ✅ Directions 15 (이륜차 최적화 엔진)
        let naverUrl = `https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving?start=${start}&goal=${goal}&option=traavoidcaronly`;
        if (waypoints && waypoints.trim() !== "") naverUrl += `&waypoints=${waypoints}`;

        const naverRes = await fetch(naverUrl, {
          method: "GET",
          headers: {
            "X-NCP-APIGW-API-KEY-ID": clientId.trim(),
            "X-NCP-APIGW-API-KEY": clientSecret.trim(),
            // 🔥 [해결책 핵심] 네이버 콘솔에 등록된 URL을 Referer로 강제 주입
            "Referer": "https://bori.pages.dev" 
          }
        });

        const naverData = await naverRes.json();

        if (!naverRes.ok) {
          return new Response(JSON.stringify({
            error: "NAVER_API_ERROR",
            detail: naverData.message || naverData.errorMessage || "인증 실패: 콘솔의 IP 필터링을 비우고 Web 서비스 URL에 워커 주소를 추가했는지 확인해 줘!"
          }), { status: naverRes.status, headers: corsHeaders });
        }

        return new Response(JSON.stringify(naverData), { headers: corsHeaders });
      }

      // --- DB CRUD 로직 ---
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
