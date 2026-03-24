import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Tạm thời comment dòng này lại
// import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, 
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

// TẮT ĐOẠN NÀY ĐI CÔNG ƠI:
/*
if (typeof window !== "undefined" && (location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
  isTokenAutoRefreshEnabled: true
});
*/

export const auth = getAuth(app);
auth.languageCode = 'vi'; // Thêm dòng này để tin nhắn gửi về bằng tiếng Việt
export default app;