import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAMlnp93pBXil5eIN8M_VNlCYWHMsjRj-4",
    authDomain: "dseller-c21ee.firebaseapp.com",
    databaseURL: "https://dseller-c21ee-default-rtdb.firebaseio.com",
    projectId: "dseller-c21ee",
    storageBucket: "dseller-c21ee.firebasestorage.app",
    messagingSenderId: "56884086045",
    appId: "1:56884086045:web:4f86d9d268511c43a68df4",
    measurementId: "G-WZZV3QCYFH"
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const auth: Auth = getAuth(app);

export default app;

