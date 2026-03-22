/**
 * Running Log Bridge Worker (AI Vision 정밀 수리본)
 * 수정 내용: JSON 추출 정규식 강화 및 심박수 매핑 보강
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const GAS_URL = "[https://script.google.com/macros/s/AKfycbwtsBHmRJc2NctaIeA7H-vCg-mM1cQPPUiCs7KpU-ujeUgmTAXijQbIbZ2ScYeyQCTJ/exec](https://script.google.com/macros/s/AKfycbwtsBHmRJc2NctaIeA7H-vCg-mM1cQPPUiCs7KpU-ujeUgmTAXijQbIbZ2ScYeyQCTJ/exec)";

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

    if (request.method === "GET") {
      try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "GAS 연동 오류" }), { status: 500 });
      }
    }

    if (request.method === "POST") {
      if (!isAdmin) return new Response("Forbidden", { status: 403 });

      if (url.pathname.endsWith("/analyze-image")) {
        try {
          const { image } = await request.json();
          const genAI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
          
          const prompt = `
            Analyze this running screenshot and return a JSON object.
            Fields needed:
            - "date": Date in YYYY-MM-DD format only.
            - "distance": Distance as a number (e.g., 7.42).
            - "time": Total time in HH:MM:SS format.
            - "heart_rate": Average heart rate as an integer.
            - "cadence": Average cadence as an integer.
            
            Return ONLY the raw JSON object. No extra text, no backticks.
          `;

          const response = await fetch(genAI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: image } }] }]
            })
          });

          const result = await response.json();
          const textResponse = result.candidates[0].content.parts[0].text;
          
          // ✅ 핵심 수리: { } 사이의 데이터만 완벽하게 골라내는 정규식 적용
          const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("JSON 형식을 찾을 수 없음");
          
          const cleanedJson = jsonMatch[0];
          
          return new Response(cleanedJson, {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });

        } catch (error) {
          return new Response(JSON.stringify({ error: "AI 분석 실패", detail: error.message }), {
            status: 500, headers: { "Access-Control-Allow-Origin": "*" }
          });
        }
      }

      // 기존 기록 저장 로직
      const body = await request.json();
      const response = await fetch(GAS_URL, { method: "POST", body: JSON.stringify(body) });
      const resData = await response.json();
      return new Response(JSON.stringify(resData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};
