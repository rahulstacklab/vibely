import { createRemoteJWKSet, jwtVerify } from 'jose';

const firebaseKeys = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);
const validId = /^[A-Za-z0-9_-]{1,128}$/;

const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }
});

const sha1 = async (value) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
};

export async function onRequestPost({ request, env }) {
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  const projectId = env.FIREBASE_PROJECT_ID || 'vibely-app-68415';

  if (!cloudName || !apiKey || !apiSecret) {
    return json({ error: 'Cloudinary signing is not configured on the server.' }, 503);
  }

  try {
    const authorization = request.headers.get('Authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) return json({ error: 'Sign in before uploading files.' }, 401);

    const { payload } = await jwtVerify(token, firebaseKeys, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId
    });
    const uid = payload.sub;
    if (typeof uid !== 'string' || !uid) {
      return json({ error: 'Invalid Firebase sign-in token.' }, 401);
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 12 * 1024) {
      return json({ error: 'Upload signing request is too large.' }, 413);
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: 'Invalid request body.' }, 400);
    }
    const { chatId, messageId, type, fileName } = body;
    if (
      !validId.test(chatId || '') ||
      !validId.test(messageId || '') ||
      !['image', 'video', 'document', 'voice'].includes(type) ||
      typeof fileName !== 'string' ||
      !fileName.trim()
    ) {
      return json({ error: 'Invalid upload details.' }, 400);
    }

    const chatResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/chats/${encodeURIComponent(chatId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!chatResponse.ok) {
      return json({
        error: chatResponse.status === 404
          ? 'You are not a member of this conversation.'
          : 'Could not verify conversation access.'
      }, chatResponse.status === 404 ? 403 : 502);
    }

    const chatDocument = await chatResponse.json();
    const participants = chatDocument.fields?.participants?.arrayValue?.values || [];
    if (!participants.some(participant => participant.stringValue === uid)) {
      return json({ error: 'You are not a member of this conversation.' }, 403);
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
    const signature = await sha1(`${toSign}${apiSecret}`);

    return json({
      cloudName,
      apiKey,
      resourceType,
      folder,
      publicId,
      timestamp,
      signature
    });
  } catch (error) {
    if (
      error?.code?.startsWith('ERR_JWT_') ||
      error?.code?.startsWith('ERR_JWS_')
    ) {
      return json({ error: 'Your sign-in expired or is invalid. Sign in again and retry.' }, 401);
    }
    console.error('Cloudinary signing request failed:', error);
    return json({ error: 'Could not prepare the secure upload. Please try again.' }, 500);
  }
}
