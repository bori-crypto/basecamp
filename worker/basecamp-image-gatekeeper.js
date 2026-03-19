// worker/basecamp-image-gatekeeper.js
var basecamp_image_gatekeeper_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. CORS Preflight 처리 (기본 설정)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "X-Image-Pass"
        }
      });
    }

    // 2. 보안 체크 (암호 확인)
    const providedPass = request.headers.get("X-Image-Pass");
    if (providedPass !== env.IMAGE_PASS) {
      return new Response("Unauthorized: 접근 권한이 없습니다.", {
        status: 401,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    const objectKey = url.pathname.slice(1);

    // 3. [핵심] 폴더 목록 리스팅 기능 (주소가 /로 끝날 경우)
    if (objectKey.endsWith('/')) {
      try {
        // R2 버킷에서 해당 접두사(Prefix)를 가진 목록 조회
        const listed = await env.MY_BUCKET.list({ prefix: objectKey });
        
        // 파일 이름만 추출하여 JSON 배열로 반환 (폴더명 제외)
        const fileList = listed.objects
          .map(obj => obj.key.replace(objectKey, ""))
          .filter(name => name !== "");

        return new Response(JSON.stringify(fileList), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "X-Image-Pass"
          }
        });
      } catch (err) {
        return new Response("Error: 목록 로드 실패", { 
          status: 500, 
          headers: { "Access-Control-Allow-Origin": "*" } 
        });
      }
    }

    // 4. 개별 파일 반환 (기존 로직)
    if (!objectKey) {
      return new Response("Bad Request: 파일명이 없습니다.", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    const object = await env.MY_BUCKET.get(objectKey);
    if (object === null) {
      return new Response("Not Found: 사진을 찾을 수 없습니다.", {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Access-Control-Allow-Origin", "*");
    
    return new Response(object.body, { headers });
  }
};

export {
  basecamp_image_gatekeeper_default as default
};
