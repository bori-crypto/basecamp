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
      // ✅ [중요] 네이버 길찾기 API 호출 부분은 삭제됨 (D1 DB 전용)
      
      const checkAuth = (req) => req.headers.get("X-Admin-Password") === env.ADMIN_SECURE;

      if (request.method === "GET") {
        const id = url.searchParams.get("id");
        if (id) {
          const result = await env.DB.prepare("SELECT * FROM bike_routes WHERE id = ?").bind(id).first();
          return new Response(JSON.stringify(result || {}), { headers: corsHeaders });
        } else {
          // 오빠가 올린 최신 사진처럼 created_at 내림차순 정렬
          const { results } = await env.DB.prepare("SELECT * FROM bike_routes ORDER BY created_at DESC").all();
          return new Response(JSON.stringify(results), { headers: corsHeaders });
        }
      }

      if (request.method === "POST") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });
        const body = await request.json();
        
        // D1 DB 컬럼에 맞게 데이터 준비
        const stmt = env.DB.prepare(
          "INSERT INTO bike_routes (title, duration, distance, points, memo, path_data) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(
          body.title || "새로운 코스",
          body.duration || "",
          body.distance || "",
          JSON.stringify(body.points || {}), // 마커 좌표 (Start, End, Vias)
          body.memo || "",
          JSON.stringify(body.path_data || []) // GPX에서 추출한 수천 개의 LatLng 좌표
        );
        
        await stmt.run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (request.method === "PUT") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });
        const body = await request.json();
        if (!body.id) return new Response("Missing ID", { status: 400 });

        const stmt = env.DB.prepare(
          "UPDATE bike_routes SET title=?, duration=?, distance=?, points=?, memo=?, path_data=? WHERE id=?"
        ).bind(
          body.title, body.duration, body.distance, JSON.stringify(body.points || {}), body.memo, JSON.stringify(body.path_data || []), body.id
        );
        
        await stmt.run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (request.method === "DELETE") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });
        const id = url.searchParams.get("id");
        await env.DB.prepare("DELETE FROM bike_routes WHERE id=?").bind(id).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
