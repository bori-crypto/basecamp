/**
 * Basecamp Bike API Worker
 * 기능: React 앱과 Cloudflare D1 데이터베이스 간의 통신
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. CORS 프리플라이트 처리 (브라우저 보안 통과)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
        },
      });
    }

    // 공통 응답 헤더
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };

    // 2. 관리자 권한 체크 함수 (데이터를 쓸 때만 필요)
    const checkAuth = (req) => {
      const pass = req.headers.get("X-Admin-Password");
      return pass === env.ADMIN_SECURE;
    };

    try {
      // ==========================================
      // [GET] 코스 목록 및 상세 데이터 조회
      // ==========================================
      if (request.method === "GET") {
        const id = url.searchParams.get("id");
        
        if (id) {
          const stmt = env.DB.prepare("SELECT * FROM bike_routes WHERE id = ?").bind(id);
          const result = await stmt.first();
          return new Response(JSON.stringify(result || {}), { headers: corsHeaders });
        } else {
          const stmt = env.DB.prepare("SELECT * FROM bike_routes ORDER BY created_at DESC");
          const { results } = await stmt.all();
          return new Response(JSON.stringify(results), { headers: corsHeaders });
        }
      }

      // ==========================================
      // [POST] 새로운 코스 및 GPX 경로 등록
      // ==========================================
      if (request.method === "POST") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        
        const body = await request.json();
        const stmt = env.DB.prepare(
          `INSERT INTO bike_routes (title, duration, distance, waypoints, memo, path_data) 
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          body.title || "새로운 코스",
          body.duration || "",
          body.distance || "",
          JSON.stringify(body.waypoints || []),
          body.memo || "",
          JSON.stringify(body.path_data || []) // ✅ FIX: 거대한 배열을 문자열로 완벽히 포장해서 저장
        );
        
        await stmt.run();
        return new Response(JSON.stringify({ success: true, message: "저장 완료!" }), { headers: corsHeaders });
      }

      // ==========================================
      // [PUT] 기존 코스 정보/경로 수정 (3단계 즉석 수정용)
      // ==========================================
      if (request.method === "PUT") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        
        const body = await request.json();
        if (!body.id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: corsHeaders });

        const stmt = env.DB.prepare(
          `UPDATE bike_routes 
           SET title = ?, duration = ?, distance = ?, waypoints = ?, memo = ?, path_data = ? 
           WHERE id = ?`
        ).bind(
          body.title,
          body.duration,
          body.distance,
          JSON.stringify(body.waypoints || []),
          body.memo,
          JSON.stringify(body.path_data || []), // ✅ FIX: 업데이트할 때도 문자열로 확실히 포장
          body.id
        );
        
        await stmt.run();
        return new Response(JSON.stringify({ success: true, message: "수정 완료!" }), { headers: corsHeaders });
      }

      // ==========================================
      // [DELETE] 코스 삭제
      // ==========================================
      if (request.method === "DELETE") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        
        const id = url.searchParams.get("id");
        if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: corsHeaders });

        const stmt = env.DB.prepare("DELETE FROM bike_routes WHERE id = ?").bind(id);
        await stmt.run();
        return new Response(JSON.stringify({ success: true, message: "삭제 완료!" }), { headers: corsHeaders });
      }

      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

    } catch (err) {
      console.error("D1 Error:", err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
