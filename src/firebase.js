import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBQ0G8t61TFBA1aLWxhn0p02da8Nd5WDs4",
  authDomain: "vibely-app-68415.firebaseapp.com",
  projectId: "vibely-app-68415",
  storageBucket: "vibely-app-68415.firebasestorage.app",
  messagingSenderId: "31837038528",
  appId: "1:31837038528:web:ac8ce1db8564f344b94a25",
  measurementId: "G-E28RZXB59S"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const firebaseConfigured = Boolean(
  !/^your_/i.test(firebaseConfig.apiKey) &&
  !/^your_/i.test(firebaseConfig.appId)
);
