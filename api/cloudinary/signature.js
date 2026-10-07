import { onRequestPost } from '../../functions/api/cloudinary/signature.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12kb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
  }

  const request = new Request(new URL(req.url, `https://${req.headers.host || 'localhost'}`), {
    method: 'POST',
    headers,
    body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
  });
  const response = await onRequestPost({ request, env: process.env });

  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.status(response.status).send(await response.text());
}
