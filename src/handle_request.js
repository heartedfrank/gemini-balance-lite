import { handleVerification } from './verify_keys.js';
import openai from './openai.mjs';
export async function handleRequest(request) {

  const url = new URL(request.url);

   console.log(`handleRequest url=: ${url}`);
  const pathname = url.pathname;
  const search = url.search;

    console.log(`handleRequest pathname=: ${pathname}`);
    console.log(`handleRequest search=: ${search}`);
  if (pathname === '/' || pathname === '/index.html') {
    return new Response('Proxy is Running!  More Details: https://github.com/tech-shrimp/gemini-balance-lite', {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  if (pathname === '/verify' && request.method === 'POST') {
      console.log(`handleRequest handleVerification return`);
    return handleVerification(request);

  }

  // 处理OpenAI格式请求
  // if (url.pathname.endsWith("/chat/completions") || url.pathname.endsWith("/completions") || url.pathname.endsWith("/embeddings") || url.pathname.endsWith("/models")) {
    if (url.pathname.endsWith("/chat/completions") || url.pathname.endsWith("/completions") || url.pathname.endsWith("/embeddings")) {

      console.log(`handleRequest openai return`);
    return openai.fetch(request);
  }

  const targetUrl = `https://generativelanguage.googleapis.com${pathname}${search}`;

  //  const targetUrl = request.url;

  console.log(`Gemini targetUrl=: ${targetUrl}`);

  try {
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      if (key.trim().toLowerCase() === 'x-goog-api-key') {
        const apiKeys = value.split(',').map(k => k.trim()).filter(k => k);
        if (apiKeys.length > 0) {
          const selectedKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
          console.log(`Gemini Selected API Key: ${selectedKey}`);
          headers.set('x-goog-api-key', selectedKey);
        }
      } else {
        if (key.trim().toLowerCase()==='content-type')
        {
           headers.set(key, value);
        }
      }
    }

      headers.set('x-goog-api-key', 'AIzaSyBZyuRRgU9Aq0fIIf1vsAMARTcjLAo8KRA');
      headers.set( 'Content-Type', 'application/json');




      console.log('Request Sending to Gemini')
    console.log('targetUrl:'+targetUrl)
    console.log(headers)

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body
    });

    console.log("Call Gemini Success")

    const responseHeaders = new Headers(response.headers);

    console.log('Header from Gemini:')
    console.log(responseHeaders)

    responseHeaders.delete('transfer-encoding');
    responseHeaders.delete('connection');
    responseHeaders.delete('keep-alive');
    responseHeaders.delete('content-encoding');
    responseHeaders.set('Referrer-Policy', 'no-referrer');



      const { models } = JSON.parse(await response.text());
      console.log(`Gemini response models=:`,models);
      if (response.ok) {
          const { models } = JSON.parse(await response.text());
         const body = JSON.stringify({
              object: "list",
              data: models.map(({ name }) => ({
                  id: name.replace("models/", ""),
                  object: "model",
                  created: 0,
                  owned_by: "",
              })),
          }, null, "  ");
          console.log(`Gemini response=:`,body);
      }



    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });

  } catch (error) {
   console.error('Failed to fetch:', error);
   return new Response('Internal Server Error\n' + error?.stack, {
    status: 500,
    headers: { 'Content-Type': 'text/plain' }
   });
}
};
