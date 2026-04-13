import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, get, child, update, remove, push, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyAvdKeXYSvb5RPuHuTuavlsbgJU_w3o8FA",
    authDomain: "r-ats-recruit.firebaseapp.com",
    databaseURL: "https://r-ats-recruit-default-rtdb.firebaseio.com",
    projectId: "r-ats-recruit",
    storageBucket: "r-ats-recruit.firebasestorage.app",
    messagingSenderId: "879859077899",
    appId: "1:879859077899:web:3a6709b50e73d7e415880e",
    measurementId: "G-6C8ZYY4TFR"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// --- CONFIGURACIÓN DE GOOGLE PROVIDER ---
const googleProvider = new GoogleAuthProvider();
// Esta es la parte que añadimos:
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
// ----------------------------------------

const analytics = getAnalytics(app);

// EXPORTACIÓN
export { 
    db, auth, googleProvider, analytics, 
    signInWithPopup, ref, set, get, child, update, remove, push, onValue,
    signInWithEmailAndPassword, signOut, onAuthStateChanged 
};