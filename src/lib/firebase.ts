import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBUvwY-e7h0KZyFJv7n0ignpzlMUGJIurU",
  authDomain: "niklaus-b2b.firebaseapp.com",
  projectId: "niklaus-b2b",
  storageBucket: "niklaus-b2b.firebasestorage.app",
  messagingSenderId: "936430517671",
  appId: "1:936430517671:web:6a0f1b86a39621d74c4a82",
  measurementId: "G-3VGKJGWFSY",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
