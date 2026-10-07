import { auth } from '../firebase.js';

const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL?.trim().replace(/\/+$/, '');
const SIGNATURE_ENDPOINT = UPLOAD_API_URL
  ? `${UPLOAD_API_URL}/api/cloudinary/signature`
  : '/api/cloudinary/signature';

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null;
  if (!response.ok) {
    if (response.status === 405 || !contentType.includes('application/json')) {
      throw new Error(
        'The upload-signing API is not deployed or routed for this live site. Deploy the /api/cloudinary/signature serverless function, or set VITE_UPLOAD_API_URL to a deployed API base URL.'
      );
    }
    throw new Error(payload?.error || `Upload failed (HTTP ${response.status}).`);
  }
  if (!payload) {
    throw new Error('The upload-signing API returned an invalid response.');
  }
  return payload;
};

export const uploadToCloudinary = async (file, { chatId, messageId, type }) => {
  if (!(file instanceof Blob)) {
    throw new Error('A valid File or Blob is required for upload.');
  }
  if (!auth.currentUser) {
    throw new Error('Sign in before uploading files.');
  }

  const token = await auth.currentUser.getIdToken();
  const signature = await parseResponse(await fetch(SIGNATURE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chatId,
      messageId,
      type,
      fileName: file.name || `${type}-attachment`
    })
  }));

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', signature.timestamp);
  formData.append('folder', signature.folder);
  formData.append('public_id', signature.publicId);
  formData.append('overwrite', 'false');
  formData.append('signature', signature.signature);

  const cloudinaryResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`,
    { method: 'POST', body: formData }
  );
  const result = await cloudinaryResponse.json().catch(() => null);
  if (!cloudinaryResponse.ok || result?.error) {
    throw new Error(result?.error?.message || `Cloudinary upload failed (HTTP ${cloudinaryResponse.status}).`);
  }
  if (!result?.secure_url || !result.public_id || !result.resource_type) {
    throw new Error('Cloudinary returned an incomplete upload response.');
  }

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    format: result.format,
    bytes: result.bytes
  };
};
