// src/firebase/firebase.js

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";  // ← Add this import

const firebaseConfig = {
  apiKey: "AIzaSyD36t1pASxk66iD1xxcmdVUJhg6yNY_-9g",
  authDomain: "fechzodelivery.firebaseapp.com",
  projectId: "fechzodelivery",
  storageBucket: "fechzodelivery.firebasestorage.app",
  messagingSenderId: "63494596806",
  appId: "1:63494596806:web:fb52afe5b0a2cbbbdc4fc7",
  measurementId: "G-MRXY7TFRHL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Optional: Analytics (you can remove if not needed)
const analytics = getAnalytics(app);

// Export Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);  // ← This is what Signup.jsx needs

export default app;