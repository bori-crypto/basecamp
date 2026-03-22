/**
 * Running Log Bridge Worker (AI Vision Edition)
 * 기능: React 앱과 GAS 연결 및 Gemini Vision을 통한 사진 분석 (심박수 추가 및 맵핑 보강)
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

    const adminPassword = request.headers.get("X-Admin-Password");
    const isAdmin = adminPassword === env.ADMIN_SECURE;

    // 2. GET: 데이터 조회
    if (request.method === "GET") {
      try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "GAS 연결 실패" }), {
          status: 500, headers: { "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // 3. POST: 기능 분기
    if (request.method === "POST") {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "권한이 없습니다." }), {
          status: 403, headers: { "Access-Control-Allow-Origin": "*" }
        });
      }

      // ✅ 사진 분석 요청 처리 (/analyze-image)
      if (url.pathname.endsWith("/analyze-image")) {
        try {
          const { image } = await request.json();
          
          const genAI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
          
          // ✅ 프롬프트 수정: heart_rate 추가 및 문자열 형식 강제
          const prompt = `
            Extract running data from this screenshot. 
            Return ONLY a JSON object with these keys: 
            "date" (YYYY-MM-DD), 
            "distance" (String like "7.42"), 
            "time" (String like "00:50:25"), 
            "pace" (String like "06:48"), 
            "heart_rate" (String like "171"),
            "cadence" (String like "171").
            
            IMPORTANT: Return only raw JSON. No markdown blocks, no extra text.
          `;

          const response = await fetch(genAI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: "image/jpeg", data: image } }
                ]
              }]
            })
          });

          const result = await response.json();
          if (!result.candidates || !result.candidates[0]) {
            throw new Error("AI 대답 생성 실패");
          }

          const textResponse = result.candidates[0].content.parts[0].text;
          
          // JSON 외의 불필요한 마크업(```json 등) 제거 정규식 보강
          const cleanedJson = textResponse.replace(/```json|```|[\u200B-\u200D\uFEFF]/g, "").trim();
          
          return new Response(cleanedJson, {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });

        } catch (error) {
          return new Response(JSON.stringify({ error: "AI 분석 실패", detail: error.message }), {
            status: 500, headers: { "Access-Control-Allow-Origin": "*" }
          });
        }
      }

      // 기존: 기록 저장 요청 처리 (GAS로 전달)
      try {
        const body = await request.json();
        const response = await fetch(GAS_URL, {
          method: "POST",
          body: JSON.stringify(body),
        });
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "저장 실패" }), {
          status: 500, headers: { "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
