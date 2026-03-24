import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Tạm thời bỏ App Check để test SMS cho thông
// import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, 
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Chỉ bật Debug Token khi ở Local
if (typeof window !== "undefined" && (location.hostname === "localhost")) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

export const auth = getAuth(app);
// Cấu hình ngôn ngữ Tiếng Việt cho SMS
auth.languageCode = 'vi'; 

export default app;