// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBSa6-FliwhbWZX_DsQsuziEzp18uNSyWs",
  authDomain: "savefood-69626.firebaseapp.com",
  projectId: "savefood-69626",
  storageBucket: "savefood-69626.firebasestorage.app",
  messagingSenderId: "501387715451",
  appId: "1:501387715451:web:004afdeb4c252098ba13de",
  measurementId: "G-Z0L1RPT993"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
auth.languageCode = "es";

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);
