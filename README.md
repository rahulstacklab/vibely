# Vibely

Vibely is a React and Vite chat app backed by Firebase Authentication and Cloud Firestore. Accounts use email and password; conversations and messages update live for both participants.

## Firebase setup

1. In the Firebase console for the `vibely-app-68415` project, enable **Authentication → Sign-in method → Email/Password** and create a **Cloud Firestore** database.
2. Register or select the Firebase web app and copy its web configuration into a local `.env` file. Start from `.env.example`; the API key and app ID must be replaced with the values from **Project settings → Your apps**.
3. Publish the security rules in `firestore.rules` using the Firebase console Rules tab, or deploy them with the Firebase CLI:

   ```sh
   firebase deploy --only firestore:rules
   ```

4. Start the app:

   ```sh
   npm install
   npm run dev
   ```

The Firebase web configuration is public client configuration, not a server secret. Firestore security rules enforce that users can only read chats they participate in and can only send messages as themselves. Do not launch with Firestore in test mode.
