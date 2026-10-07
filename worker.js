import { onRequestPost } from './functions/api/cloudinary/signature.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/cloudinary/signature') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
          status: 405,
          headers: {
            Allow: 'POST',
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
          }
        });
      }

      return onRequestPost({ request, env });
    }

    return env.ASSETS.fetch(request);
  }
};
