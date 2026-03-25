/**
 * Running Log Bridge Worker (순정 원상복구본)
 * 기능: React 앱과 Google Apps Script(GAS) 간의 보안 통로 역할
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const GAS_URL = "https://script.google.com/macros/s/AKfycbwtsBHmRJc2NctaIeA7H-vCg-mM1cQPPUiCs7KpU-ujeUgmTAXijQbIbZ2ScYeyQCTJ/exec";

    // 1. CORS 프리플라이트 처리
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
        },
      });
    }

    // 2. 관리자 권한 체크 (POST 요청 시 필수)
    const adminPassword = request.headers.get("X-Admin-Password");
    const isAdmin = adminPassword === env.ADMIN_SECURE;

    // 3. GET: 러닝 데이터 조회
    if (request.method === "GET") {
      try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "GAS 연결 실패" }), { 
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // 4. POST: 새로운 러닝 기록 추가 (관리자 전용)
    if (request.method === "POST") {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "권한이 없습니다." }), {
          status: 403,
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }

      try {
        const body = await request.json();
        const response = await fetch(GAS_URL, {
          method: "POST",
          body: JSON.stringify(body),
        });
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "기록 저장 실패" }), { 
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    return new Response("Method Not Allowed", { status: 405 });
  },
};
