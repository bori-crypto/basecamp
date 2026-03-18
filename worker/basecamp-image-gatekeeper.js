export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. CORS Preflight (브라우저의 사전 허락 요청 처리)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*", // 필요 시 오빠의 도메인으로 제한 가능
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "X-Image-Pass", // 우리가 만든 암호 헤더 허용
        },
      });
    }

    // 2. 보안 게이트 (암호 확인)
    const providedPass = request.headers.get("X-Image-Pass");
    // env.IMAGE_PASS는 깃허브 액션 배포 시 주입될 환경변수야
    if (providedPass !== env.IMAGE_PASS) {
      return new Response("Unauthorized: 접근 권한이 없습니다.", {
        status: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    // 3. R2 창고에서 사진 찾기
    // 예: https://worker-url.com/photos/image.jpg -> 파일 경로(key): photos/image.jpg
    const objectKey = url.pathname.slice(1); 

    if (!objectKey) {
      return new Response("Bad Request: 파일 경로가 지정되지 않았습니다.", { 
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

    // 4. 사진 포장해서 반환 (헤더 설정)
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Access-Control-Allow-Origin", "*"); // 리액트 앱에서 읽을 수 있게 허용

    return new Response(object.body, {
      headers,
    });
  },
};
