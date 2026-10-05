/**
 * Uploads a File or Blob (Images, Videos, Audio) to Cloudinary.
 * @param {File | Blob} file
 * @returns {Promise<string>} Secure URL of the uploaded file
 */

const CLOUD_NAME = 'w1j3tpbt';
const UPLOAD_PRESET = 'vibely';

export const uploadToCloudinary = async (file) => {
  if (!(file instanceof Blob)) {
    throw new Error('A valid File or Blob is required for upload.');
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || UPLOAD_PRESET;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Cloudinary upload failed');
    }

    const data = await response.json();
    if (!data?.secure_url) {
      throw new Error('Cloudinary upload response is missing a secure URL.');
    }

    return data.secure_url;
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};