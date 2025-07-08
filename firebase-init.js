import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEb30ubi5RYPv8PUX5bzhVdkfodjwmsI4",
  authDomain: "controlealoja.firebaseapp.com",
  projectId: "controlealoja",
  storageBucket: "controlealoja.firebasestorage.app",
  messagingSenderId: "621275694865",
  appId: "1:621275694865:web:25c365d11c1d2f90de6eb0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

