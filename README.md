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

The Cloudinary API secret stays server-side. The upload API verifies Firebase ID tokens and verifies the user's chat membership before signing Cloudinary uploads. Cloudinary hosts attachments; Firestore rules restrict attachment-message creation to signed-in chat members. The app limits attachments to 50 MB. Voice recording requires microphone permission and a secure browser context (HTTPS or localhost).

## Vercel deployment

Vercel serves the Vite frontend and the serverless signing endpoint at `/api/cloudinary/signature` from `api/cloudinary/signature.js`. In the Vercel project settings, add these environment variables for the Production environment (and Preview if needed):

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET` (store as a secret; do not use a `VITE_` prefix)
- `FIREBASE_PROJECT_ID` (`vibely-app-68415`)

Redeploy the project after adding the variables. Do not put the Cloudinary API secret in frontend code or a committed file: Vite bundles frontend code for browsers, where embedded secrets are public.

## Cloudflare Workers deployment

The `workers.dev` site uses `worker.js` for `/api/cloudinary/signature` and serves the built Vite files from `dist`. Configure the Cloudinary values as Worker secrets, then build and deploy from the repository root:

```sh
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
npx wrangler secret put FIREBASE_PROJECT_ID
npm run build
npx wrangler deploy
```

Wrangler prompts for each secret value; they are stored server-side and are not included in the static assets. The `wrangler.jsonc` configuration targets the `vibely` Worker and routes the signing endpoint through the Worker. Deploying this Worker configuration is required for the `/api/cloudinary/signature` route to work on `https://vibely.rahulkumar143221.workers.dev/`.

## Cloudflare Pages deployment

This repository includes a Cloudflare Pages Function at `functions/api/cloudinary/signature.js`. Cloudflare Pages deploys it at `/api/cloudinary/signature` alongside the static Vite frontend, so no separate Node upload service or `VITE_UPLOAD_API_URL` is needed.

In Cloudflare Pages → your project → **Settings → Variables and Secrets**, add these server-side variables for the production environment:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET` (mark as a secret)
- `FIREBASE_PROJECT_ID` (`vibely-app-68415`)

Then trigger a new Pages deployment. Keep the Cloudinary API secret out of all `VITE_` variables and never commit `.env`. The `server/index.js` Node API remains available for local development (`npm run dev`); the Cloudflare Pages Function is used by the deployed frontend. Do not launch with Firestore in test mode.

If you cannot manage variables in the Cloudflare dashboard, set them as Pages secrets with Wrangler instead. From the repository root, replace `<YOUR_PAGES_PROJECT_NAME>` with the Pages project name; Wrangler prompts for each value:

```sh
npx wrangler pages secret put CLOUDINARY_CLOUD_NAME --project-name <YOUR_PAGES_PROJECT_NAME>
npx wrangler pages secret put CLOUDINARY_API_KEY --project-name <YOUR_PAGES_PROJECT_NAME>
npx wrangler pages secret put CLOUDINARY_API_SECRET --project-name <YOUR_PAGES_PROJECT_NAME>
npm run build
npx wrangler pages deploy dist --project-name <YOUR_PAGES_PROJECT_NAME>
```

The secret values are stored by Cloudflare and are not added to the frontend bundle or repository. Do not paste the API secret into source code, a `VITE_` variable, or a committed config file.
