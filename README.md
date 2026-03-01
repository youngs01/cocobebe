<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f18562f5-963d-4936-a279-a465db069e58

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Create a `.env.local` file with your configuration. Example:
   ```dotenv
   # basic values used by both front‑end and server
   APP_URL="http://localhost:3000"          # used by login redirects
   ADMIN_NAME="admin"                       # seeded admin user
   ADMIN_PASSWORD="admin1234"               # seeded password

   # database
   DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   # Netlify will inject this for you; leave blank locally to use SQLite fallback.
   # If your provider requires SSL, set DB_SSL=true
   ```
3. Run the app:
   `npm run dev`

## Deploying to Netlify (front‑end + back‑end)

This project can be hosted entirely on Netlify using Netlify Functions for the
API and a static site for the React app.

1. Push the repository to GitHub.
2. In the Netlify dashboard choose **New site from Git** and point to this repo.
3. Configure the build settings:
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
4. Add environment variables under **Site settings → Build & deploy → Environment**:
   ```text
   DATABASE_URL=<your PostgreSQL connection string>
   DB_SSL=true        # if your provider requires SSL
   ADMIN_NAME=admin
   ADMIN_PASSWORD=admin1234
   VITE_API_URL=https://<your-netlify-site>.netlify.app
   ```
   The `VITE_API_URL` value points front‑end code to the serverless API
   (the same Netlify site; `/api/*` is proxied automatically).
5. (Optional) if you have a custom domain, attach it in Netlify’s domain settings.

Netlify Functions run the Express app using `serverless-http`; the server
initializes tables on cold start, and the static assets are served directly by
Netlify. CORS is enabled to allow the front‑end to communicate with the API.

You can test locally with Netlify CLI (`netlify dev`) or by running the handler
manually:

```bash
npm install
npm run build   # build frontend
netlify dev     # starts both functions and a dev server
```

Migrations run automatically each time the function cold‑starts; the
PostgreSQL database lives externally (e.g. Supabase, ElephantSQL, Render
Add‑on). For local development the code will fall back to a file‑based
SQLite database (`cocobebe.db`) when `DATABASE_URL` is not set.

Once Netlify deployment succeeds you can verify the API with:

```bash
curl https://<your-netlify-site>.netlify.app/api/db-test
curl https://<your-netlify-site>.netlify.app/api/teachers
```

And reset the administrator account with:

```bash
curl -X POST https://<your-netlify-site>.netlify.app/api/admin \
  -H 'Content-Type: application/json' \
  -d '{"name":"admin","password":"admin1234"}'
```


