# Firebase Setup Instructions

## 1. Create Firebase Project ✅ COMPLETED

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `pci-payment-portal`
4. Enable Google Analytics (optional)
5. Click "Create project"

**Project ID:** `pci-payment-portal`

## 2. Enable Firestore Database ⚠️ REQUIRED

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to your users)

**Status:** ⚠️ **Please enable Firestore Database in Firebase Console**

## 3. Enable Authentication ⚠️ REQUIRED

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider

**Status:** ⚠️ **Please enable Email/Password authentication in Firebase Console**

## 4. Get Firebase Configuration

1. In Firebase Console, go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Web app" icon (</>)
4. Enter app name: `payment-portal-web`
5. Copy the config object

## 5. Environment Variables ✅ COMPLETED

The `.env.local` file has been created with the actual Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAtg70oyZt9Mzi4mB6GLsDEnBBm0NdshtI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pci-payment-portal.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pci-payment-portal
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pci-payment-portal.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=977200076461
NEXT_PUBLIC_FIREBASE_APP_ID=1:977200076461:web:a0cb7ef92ed0010b43d824
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-VN0VYX7ZKC
```

## 6. Firestore Security Rules

Update your Firestore rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 7. Collections Structure

The app will use these Firestore collections:

- `reservations` - Store reservation data
- `paymentMethods` - Store payment method configurations
- `userProgress` - Store user's progress and selections

## 8. Next Steps

1. **Enable Firestore Database** in Firebase Console
2. **Enable Authentication** with Email/Password in Firebase Console
3. **Start the application:**
   ```bash
   npm run dev
   ```
4. **Test the features:**
   - Click the login icon in the top-right corner
   - Create an account or sign in
   - Use the sync buttons to save/load progress from cloud

## 9. Testing Firebase Integration

Once Firebase is properly configured:

1. **Sign Up/In:** Use the authentication modal
2. **Auto-sync:** Changes are automatically saved to cloud every 2 seconds
3. **Manual sync:** Use "Sync to Cloud" and "Sync from Cloud" buttons
4. **Cross-device:** Sign in on different devices to see synced data

**Current Status:** ✅ Configuration complete, ⚠️ Firebase services need to be enabled
