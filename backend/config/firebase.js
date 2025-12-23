const admin = require("firebase-admin");
const path = require("path");
const { FIREBASE_DATABASE_URL } = require("./constants");

// Initialize Firebase Admin
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) {
    return admin;
  }

  try {
    if (!admin.apps.length) {
      let credential;

      // Option 1: Service account JSON file path (most common)
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                                  path.join(__dirname, '..', 'serviceAccountKey.json');
      
      try {
        const serviceAccount = require(serviceAccountPath);
        credential = admin.credential.cert(serviceAccount);
        console.log("✅ Firebase Admin using service account file:", serviceAccountPath);
      } catch (fileError) {
        // Option 2: Service account from environment variables
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            credential = admin.credential.cert(serviceAccount);
            console.log("✅ Firebase Admin using service account from environment variable");
          } catch (parseError) {
            console.warn("⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT env variable");
          }
        }
        
        // Option 3: Application Default Credentials (for GCP/Cloud Run)
        if (!credential) {
          try {
            credential = admin.credential.applicationDefault();
            console.log("✅ Firebase Admin using application default credentials");
          } catch (appDefaultError) {
            console.warn("⚠️ Application default credentials not available");
          }
        }
      }

      // If no credential method worked, try to initialize without explicit credential
      // This will work if Firebase is initialized elsewhere or using environment variables
      if (!credential) {
        console.warn("⚠️ No Firebase credentials found. Attempting to initialize without explicit credential...");
        console.warn("⚠️ Make sure you have:");
        console.warn("  1. A serviceAccountKey.json file in the backend directory, OR");
        console.warn("  2. FIREBASE_SERVICE_ACCOUNT environment variable set, OR");
        console.warn("  3. Google Application Default Credentials configured");
        admin.initializeApp({
          databaseURL: FIREBASE_DATABASE_URL
        });
      } else {
        admin.initializeApp({
          credential: credential,
          databaseURL: FIREBASE_DATABASE_URL
        });
      }
    }
    firebaseInitialized = true;
    console.log("✅ Firebase Admin initialized successfully");
    console.log("📍 Firebase Database URL:", FIREBASE_DATABASE_URL);
    return admin;
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:");
    console.error("   Error message:", error.message);
    console.error("   Error code:", error.code);
    console.error("   Full error:", error);
    console.error("");
    console.error("💡 To fix this issue:");
    console.error("   1. Download your Firebase service account key from:");
    console.error("      https://console.firebase.google.com/project/YOUR_PROJECT/settings/serviceaccounts/adminsdk");
    console.error("   2. Save it as 'serviceAccountKey.json' in the backend directory");
    console.error("   3. Or set the FIREBASE_SERVICE_ACCOUNT environment variable");
    // Continue without Firebase Admin if initialization fails
    firebaseInitialized = false;
    return null;
  }
}

function getFirebaseAdmin() {
  if (!firebaseInitialized) {
    return initializeFirebase();
  }
  return admin;
}

function isFirebaseInitialized() {
  return firebaseInitialized && admin.apps.length > 0;
}

module.exports = {
  initializeFirebase,
  getFirebaseAdmin,
  isFirebaseInitialized,
  admin,
};

