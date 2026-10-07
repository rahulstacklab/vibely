# Vibely

Vibely is a React and Vite chat app backed by Firebase Authentication and Cloud Firestore. Accounts use email and password; conversations and messages update live for both participants.

## Firebase setup

1. In the Firebase console for the `vibely-app-68415` project, enable **Authentication → Sign-in method → Email/Password** and create a **Cloud Firestore** database.
2. Register or select the Firebase web app and copy its web configuration into a local `.env` file. Start from `.env.example`; the API key and app ID must be replaced with the values from **Project settings → Your apps**.
3. Set the Cloudinary cloud name, API key, and API secret in the root `.env` file. The API secret is used only by the signed-upload backend and must never use a `VITE_` variable or be committed.
4. Publish the security rules in `firestore.rules` using the Firebase console Rules tab, or deploy them with the Firebase CLI:

   ```sh
   firebase deploy --only firestore:rules
   ```

5. Start the app:

   ```sh
   npm install
   npm run dev
   ```

The Cloudinary API secret stays server-side. The upload API verifies Firebase ID tokens and verifies the user's chat membership before signing Cloudinary uploads. Cloudinary hosts attachments; Firestore rules restrict attachment-message creation to signed-in chat members. The app limits attachments to 50 MB. Voice recording requires microphone permission and a secure browser context (HTTPS or localhost). In production, deploy `server/index.js` as a Node service and route `/api` to it, providing the same server environment variables there. Do not launch with Firestore in test mode.
