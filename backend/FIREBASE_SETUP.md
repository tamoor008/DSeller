# Firebase Admin SDK Setup Guide

## Important: Client SDK vs Admin SDK

⚠️ **Note**: The backend uses **Firebase Admin SDK**, which requires a **service account key** (JSON file). This is different from the client SDK credentials used by the mobile app.

- **Client SDK** (mobile app): Uses API keys (like you provided)
- **Admin SDK** (backend): Uses service account key (JSON file)

## How to Get Service Account Key

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: **dseller-c21ee**
3. Click the gear icon ⚙️ → **Project Settings**
4. Go to the **Service Accounts** tab
5. Click **"Generate New Private Key"** button
6. A JSON file will download (something like `dseller-c21ee-firebase-adminsdk-xxxxx.json`)
7. Save this file as `serviceAccountKey.json` in the `backend/` directory

**Direct Link**: https://console.firebase.google.com/project/dseller-c21ee/settings/serviceaccounts/adminsdk

## File Structure

After setup, your backend directory should have:
```
backend/
├── serviceAccountKey.json  ← Add this file here
├── config/
│   └── firebase.js
└── ...
```

## Verification

After adding the service account key, restart your backend server. You should see:

```
✅ Firebase Admin using service account file: .../serviceAccountKey.json
✅ Firebase Admin initialized successfully
📍 Firebase Database URL: https://dseller-c21ee-default-rtdb.firebaseio.com
```

## Alternative: Environment Variable

If you prefer not to use a file, you can set the service account as an environment variable:

```bash
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"dseller-c21ee",...}'
```

(The entire JSON content as a string)

## Security

⚠️ **CRITICAL**: Never commit the service account key to Git!
- ✅ Already added to `.gitignore`
- ⚠️ Contains sensitive credentials
- 🔒 Rotate keys if accidentally committed

## Current Configuration

- **Database URL**: `https://dseller-c21ee-default-rtdb.firebaseio.com`
- **Project ID**: `dseller-c21ee`
- **Default method**: Service account JSON file (`serviceAccountKey.json`)

## Troubleshooting

### Error: "Could not load the default credentials"
- ✅ Make sure `serviceAccountKey.json` exists in `backend/` directory
- ✅ Verify the file is valid JSON (not corrupted)
- ✅ Check file permissions (should be readable)

### Error: "Permission denied"
- ✅ Verify the service account has "Firebase Realtime Database Admin" role
- ✅ Check that the database rules allow admin access

### Still having issues?
Check the backend logs for detailed error messages. The updated configuration provides helpful error messages to guide you.
