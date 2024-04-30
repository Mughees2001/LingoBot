import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';


const firebaseConfig = {

  apiKey: "AIzaSyDUJQJF0doOcYG3QGZ_6POfKiYj_6MJ6V4",

  authDomain: "chatbot-7e166.firebaseapp.com",

  projectId: "chatbot-7e166",

  storageBucket: "chatbot-7e166.appspot.com",

  messagingSenderId: "838695247574",

  appId: "1:838695247574:web:b7bd8174add07b777b7377",
  measurementId: "G-B7QSC0RY8J"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const database = getDatabase(app);
export { app, storage, database };
