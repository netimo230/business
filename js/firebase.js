// js/firebase.js — Firebase initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, push, remove, onValue }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAs6we8p3MhIOrOoHJ1tKPcq7H4_lahQOg",
  authDomain: "tatanouille-1fbf7.firebaseapp.com",
  databaseURL: "https://tatanouille-1fbf7-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tatanouille-1fbf7",
  storageBucket: "tatanouille-1fbf7.firebasestorage.app",
  messagingSenderId: "105266590239",
  appId: "1:105266590239:web:33931a1d5269564c2c5b2a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, push, remove, onValue };
