import { uploadToCloudinary } from './uploadService';

// Keep this module safe even when Firebase is not configured yet.
export const sendMediaMessage = async (chatId, senderId, file, type = 'image') => {
  if (!chatId || !senderId || !file) {
    throw new Error('chatId, senderId, and file are required to send a media message.');
  }

  const mediaUrl = await uploadToCloudinary(file);

  if (!mediaUrl) {
    throw new Error('Upload did not return a media URL.');
  }

  return {
    chatId,
    senderId,
    type,
    mediaUrl,
    status: 'queued',
  };
};