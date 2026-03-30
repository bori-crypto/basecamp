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
      // ✅ Directions 5 엔진으로 완전 교체
      if (request.method === "POST" && url.pathname.includes("direction")) {
        const { start, goal, waypoints } = await request.json();
        
        // 백틱(`) 사용 엄격 준수
        let naverUrl = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}&option=traavoidcaronly`;
        if (waypoints) naverUrl += `&waypoints=${encodeURIComponent(waypoints)}`;

        const naverRes = await fetch(naverUrl, {
          method: "GET",
          headers: { 
            "X-NCP-APIGW-API-KEY-ID": env.NAVER_CLIENT_ID.trim(), 
            "X-NCP-APIGW-API-KEY": env.NAVER_CLIENT_SECRET.trim(),
            "Referer": "https://bori.pages.dev/" 
          }
        });

        const data = await naverRes.json();
        if (!naverRes.ok) return new Response(JSON.stringify({ error: "NAVER_FAIL", detail: data.message || "인증 거절" }), { status: naverRes.status, headers: corsHeaders });
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      // --- D1 DB CRUD ---
      const checkAuth = (req) => req.headers.get("X-Admin-Password") === env.ADMIN_SECURE;
      if (request.method === "GET") {
        const id = url.searchParams.get("id");
        const results = id ? await env.DB.prepare("SELECT * FROM bike_routes WHERE id = ?").bind(id).first() : (await env.DB.prepare("SELECT * FROM bike_routes ORDER BY created_at DESC").all()).results;
        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }
      if (request.method === "POST") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });
        const b = await request.json();
        await env.DB.prepare("INSERT INTO bike_routes (title, waypoints, path_data, memo) VALUES (?, ?, ?, ?)").bind(b.title, JSON.stringify(b.waypoints || []), JSON.stringify(b.path_data || []), b.memo || "").run();
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
