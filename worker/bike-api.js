/**
 * Basecamp Bike API Worker
 * 기능: React 앱과 Cloudflare D1 통신 및 네이버 길찾기(이륜차 모드) API 프록시
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
        },
      });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };

    const checkAuth = (req) => {
      const pass = req.headers.get("X-Admin-Password");
      return pass === env.ADMIN_SECURE;
    };

    try {
      // ==========================================
      // [Directions 15] 이륜차 최적화 프록시
      // ==========================================
      if (request.method === "POST" && url.pathname === "/direction") {
        const body = await request.json();
        const { start, goal, waypoints } = body;

        if (!start || !goal) {
          return new Response(JSON.stringify({ error: "출발지와 도착지 좌표가 누락되었습니다." }), { status: 400, headers: corsHeaders });
        }

        // ✅ 핵심: traavoidcaronly (자동차 전용도로 회피 = 이륜차 필수 옵션)
        let naverApiUrl = `https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving?start=${start}&goal=${goal}&option=traavoidcaronly`;
        
        if (waypoints) {
          naverApiUrl += `&waypoints=${waypoints}`;
        }

        const naverRes = await fetch(naverApiUrl, {
          method: "GET",
          headers: {
            "X-NCP-APIGW-API-KEY-ID": env.NAVER_CLIENT_ID || "",
            "X-NCP-APIGW-API-KEY": env.NAVER_CLIENT_SECRET || ""
          }
        });

        const naverData = await naverRes.json();

        // ✅ 진단 모드: 네이버가 에러를 뱉으면 프론트에 상세 이유를 그대로 전달
        if (!naverRes.ok) {
          return new Response(JSON.stringify({ 
            error: "NAVER_API_ERROR", 
            status: naverRes.status,
            detail: naverData.message || naverData.error?.message || "알 수 없는 API 에러"
          }), { status: naverRes.status, headers: corsHeaders });
        }

        return new Response(JSON.stringify(naverData), { headers: corsHeaders });
      }

      // [기존 DB CRUD 로직 유지]
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

      if (request.method === "POST" && url.pathname !== "/direction") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        const body = await request.json();
        const stmt = env.DB.prepare(
          `INSERT INTO bike_routes (title, duration, distance, waypoints, memo, path_data) VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          body.title || "새로운 코스", body.duration || "", body.distance || "", JSON.stringify(body.waypoints || []), body.memo || "", JSON.stringify(body.path_data || [])
        );
        await stmt.run();
        return new Response(JSON.stringify({ success: true, message: "저장 완료!" }), { headers: corsHeaders });
      }

      if (request.method === "PUT") {
        if (!checkAuth(request)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        const body = await request.json();
        if (!body.id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: corsHeaders });
        const stmt = env.DB.prepare(
          `UPDATE bike_routes SET title = ?, duration = ?, distance = ?, waypoints = ?, memo = ?, path_data = ? WHERE id = ?`
        ).bind(
          body.title, body.duration, body.distance, JSON.stringify(body.waypoints || []), body.memo, JSON.stringify(body.path_data || []), body.id
        );
        await stmt.run();
        return new Response(JSON.stringify({ success: true, message: "수정 완료!" }), { headers: corsHeaders });
      }

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
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
