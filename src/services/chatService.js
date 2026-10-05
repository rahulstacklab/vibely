import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { uploadToCloudinary } from './uploadService';

// Send a chat message with media attachment
export const sendMediaMessage = async (chatId, senderId, file, type = 'image') => {
  // 1. Upload media to Cloudinary (100% Free)
  const mediaUrl = await uploadToCloudinary(file);

  // 2. Save message document in Firestore
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  await addDoc(messagesRef, {
    senderId,
    type,         // 'image', 'video', or 'voice'
    mediaUrl,     // Cloudinary link
    text: '',
    createdAt: serverTimestamp(),
  });

  // 3. Update conversation last message snippet
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessage: type === 'image' ? '📷 Photo' : '🎤 Voice Note',
    updatedAt: serverTimestamp(),
  });
};