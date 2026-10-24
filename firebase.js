import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7gd9xN_nGM62WVqEHxXaLpj-NNdhtJfc",
  authDomain: "my-todo-app-8c7bf.firebaseapp.com",
  databaseURL: "https://my-todo-app-8c7bf-default-rtdb.firebaseio.com",
  projectId: "my-todo-app-8c7bf",
  storageBucket: "my-todo-app-8c7bf.firebasestorage.app",
  messagingSenderId: "102727896068",
  appId: "1:102727896068:web:ed840380759de98946f951",
  measurementId: "G-V0K3K8FQZ7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
