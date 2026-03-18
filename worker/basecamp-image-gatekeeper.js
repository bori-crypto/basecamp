export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. CORS Preflight 처리
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "X-Image-Pass",
        },
      });
    }

    // 2. 보안 게이트 (환경 변수 IMAGE_PASS 확인)
    const providedPass = request.headers.get("X-Image-Pass");
    if (providedPass !== env.IMAGE_PASS) {
      return new Response("Unauthorized: 접근 권한이 없습니다.", {
        status: 401,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    // 3. R2 창고에서 사진 찾기 (경로 예: /tour-1.jpg)
    const objectKey = url.pathname.slice(1);
    if (!objectKey) {
      return new Response("Bad Request: 파일명이 없습니다.", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    // wrangler.toml의 binding = "MY_BUCKET"과 일치해야 함
    const object = await env.MY_BUCKET.get(objectKey);

    if (object === null) {
      return new Response("Not Found: 사진을 찾을 수 없습니다.", {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    // 4. 사진 반환
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Access-Control-Allow-Origin", "*");
    
    return new Response(object.body, { headers });
  },
};
