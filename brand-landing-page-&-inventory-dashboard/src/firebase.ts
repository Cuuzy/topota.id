import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCDCLR8ohlazREFdfVtdT-mky2mquDQB9E",
  authDomain: "gen-lang-client-0348034051.firebaseapp.com",
  projectId: "gen-lang-client-0348034051",
  storageBucket: "gen-lang-client-0348034051.firebasestorage.app",
  messagingSenderId: "360008736928",
  appId: "1:360008736928:web:655bd02a57c8052160e9c5"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID from config
// Special handling for the database ID
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, "ai-studio-07274eed-9bd2-4402-bc8d-b4d7cabd31a3");

// Initialize Auth
const auth = getAuth(app);

export { app, db, auth };
