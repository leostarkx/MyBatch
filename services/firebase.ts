import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARAJODwNBsvMrbLKHi4MZ1u3UkTekBQKI",
  authDomain: "mybatchapp-2afcc.firebaseapp.com",
  projectId: "mybatchapp-2afcc",
  storageBucket: "mybatchapp-2afcc.appspot.com",
  messagingSenderId: "439355873124",
  appId: "1:439355873124:web:70bd28833aca6abc678c71",
  measurementId: "G-H06QMKGFBW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { analytics };