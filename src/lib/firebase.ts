import { initializeApp, getApps } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

// As chaves devem estar no .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "12345",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Evita crash se não houver chave real configurada
let auth: Auth;
try {
  auth = getAuth(app);
} catch (e) {
  auth = {} as Auth;
}

export { auth };

