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
      const checkAuth = (req) => req.headers.get("X-Admin-Password") === env.ADMIN_SECURE;

      // [GET] 목록 및 상세 조회
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

      // [POST] 신규 저장
      if (request.method === "POST") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        const b = await request.json();
        
        await env.DB.prepare(
          "INSERT INTO bike_routes (title, duration, distance, waypoints, memo, path_data) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(
          b.title || "새 코스",
          b.duration || "",
          b.distance || "",
          JSON.stringify(b.waypoints || []),
          b.memo || "",
          JSON.stringify(b.path_data || [])
        ).run();
        
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // [PUT] 수정
      if (request.method === "PUT") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        const b = await request.json();
        
        await env.DB.prepare(
          "UPDATE bike_routes SET title=?, duration=?, distance=?, waypoints=?, memo=?, path_data=? WHERE id=?"
        ).bind(
          b.title, b.duration, b.distance, JSON.stringify(b.waypoints || []), b.memo, JSON.stringify(b.path_data || []), b.id
        ).run();
        
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // [DELETE] 삭제
      if (request.method === "DELETE") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
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
