// public/firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyB8bYourActualApiKeyHere", // I'll generate this below
  authDomain: "vanilla-3be8f.firebaseapp.com",
  databaseURL: "https://vanilla-3be8f-default-rtdb.firebaseio.com",
  projectId: "vanilla-3be8f",
  storageBucket: "vanilla-3be8f.appspot.com",
  messagingSenderId: "108370268590768103955",
  appId: "1:108370268590768103955:web:your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();
