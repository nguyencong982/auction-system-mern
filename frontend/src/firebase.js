import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Thêm 2 import này cho App Check
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyDef4LiDjuU7dq_DS7kIqXLimh5vR-XpW4",
  authDomain: "tjsh-da301.firebaseapp.com",
  projectId: "tjsh-da301",
  storageBucket: "tjsh-da301.firebasestorage.app",
  messagingSenderId: "1029808226002",
  appId: "1:1029808226002:web:cc997b68e972f5ff61b70b",
  measurementId: "G-HL8XVF0E64"
};

const app = initializeApp(firebaseConfig);

// 1. Kích hoạt chế độ Debug nếu đang chạy trên localhost
if (typeof window !== "undefined" && (location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// 2. Cấu hình App Check
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6Lc3QossAAAAADGWtxJJBktq0uZwzNJMKqyohLXN'),
  isTokenAutoRefreshEnabled: true
});

export const auth = getAuth(app);
export default app;