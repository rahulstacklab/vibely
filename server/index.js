import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import process from 'node:process';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  FIREBASE_PROJECT_ID = 'vibely-app-68415',
  APP_ORIGIN = '',
  API_PORT = process.env.PORT || '3001'
} = process.env;

for (const [name, value] of Object.entries({
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
})) {
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
}

const secureTokenKeys = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);
const allowedOrigins = new Set(APP_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean));
const safeId = /^[A-Za-z0-9_-]{1,128}$/;
const maximumRequestBytes = 12 * 1024;
const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  const origin = request.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }

  if (request.method === 'OPTIONS' && request.url === '/api/cloudinary/signature') {
    if (origin && !allowedOrigins.has(origin)) {
      response.writeHead(403).end(JSON.stringify({ error: 'This site is not allowed to request upload signatures.' }));
      return;
    }
    response.writeHead(204).end();
    return;
  }

  if (request.method !== 'POST' || request.url !== '/api/cloudinary/signature') {
    response.writeHead(404).end(JSON.stringify({ error: 'Not found.' }));
    return;
  }

  try {
    const authorization = request.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) {
      response.writeHead(401).end(JSON.stringify({ error: 'Sign in before uploading files.' }));
      return;
    }

    const { payload } = await jwtVerify(token, secureTokenKeys, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID
    });
    const uid = payload.sub;
    if (typeof uid !== 'string' || !uid) {
      response.writeHead(401).end(JSON.stringify({ error: 'Invalid Firebase sign-in token.' }));
      return;
    }

    let rawBody = '';
    for await (const chunk of request) {
      rawBody += chunk;
      if (Buffer.byteLength(rawBody) > maximumRequestBytes) {
        response.writeHead(413).end(JSON.stringify({ error: 'Upload signing request is too large.' }));
        return;
      }
    }

    const body = JSON.parse(rawBody);
    const { chatId, messageId, type, fileName } = body;
    if (
      !safeId.test(chatId || '') ||
      !safeId.test(messageId || '') ||
      !['image', 'video', 'document', 'voice'].includes(type) ||
      typeof fileName !== 'string' ||
      !fileName.trim()
    ) {
      response.writeHead(400).end(JSON.stringify({ error: 'Invalid upload details.' }));
      return;
    }

    const chatResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/chats/${encodeURIComponent(chatId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!chatResponse.ok) {
      response.writeHead(chatResponse.status === 404 ? 403 : 502).end(JSON.stringify({
        error: chatResponse.status === 404
          ? 'You are not a member of this conversation.'
          : 'Could not verify conversation access.'
      }));
      return;
    }
    const chatDocument = await chatResponse.json();
    const participants = chatDocument.fields?.participants?.arrayValue?.values || [];
    if (!participants.some(participant => participant.stringValue === uid)) {
      response.writeHead(403).end(JSON.stringify({ error: 'You are not a member of this conversation.' }));
      return;
    }

    const resourceType = type === 'image' ? 'image'
      : type === 'document' ? 'raw'
        : 'video';
    const originalName = fileName.trim().replace(/[\\/]/g, '_').slice(0, 120);
    const extensionIndex = originalName.lastIndexOf('.');
    const baseName = (extensionIndex > 0 ? originalName.slice(0, extensionIndex) : originalName)
      .replace(/[^A-Za-z0-9_-]/g, '_')
      .slice(0, 80) || 'attachment';
    const folder = `vibely/chats/${chatId}/${uid}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const publicId = `${messageId}-${baseName}`;
    const parameters = {
      folder,
      overwrite: 'false',
      public_id: publicId,
      timestamp
    };
    const toSign = Object.entries(parameters)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    const signature = createHash('sha1')
      .update(`${toSign}${CLOUDINARY_API_SECRET}`)
      .digest('hex');

    response.writeHead(200).end(JSON.stringify({
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      resourceType,
      folder,
      publicId,
      timestamp,
      signature
    }));
  } catch (error) {
    if (error?.code === 'ERR_JWT_EXPIRED' || error?.code === 'ERR_JWS_INVALID' || error?.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
      response.writeHead(401).end(JSON.stringify({ error: 'Your sign-in expired. Sign in again and retry.' }));
      return;
    }
    if (error instanceof SyntaxError) {
      response.writeHead(400).end(JSON.stringify({ error: 'Invalid request body.' }));
      return;
    }
    console.error('Cloudinary signing request failed:', error);
    response.writeHead(500).end(JSON.stringify({ error: 'Could not prepare the secure upload. Please try again.' }));
  }
});

server.listen(Number(API_PORT), '0.0.0.0', () => {
  console.log(`Vibely upload API listening on port ${API_PORT}`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
