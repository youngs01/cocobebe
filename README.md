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
   GEMINI_API_KEY=""
   APP_URL="http://localhost:3000"
   ADMIN_NAME="admin"
   ADMIN_PASSWORD="admin1234"
   USE_POSTGRES="false"           # set true to use PostgreSQL
   DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   # OR supply individual parts: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL
   ```
3. Run the app:
   `npm run dev`

## Deploying to Render

1. Push the repository to GitHub.
2. In the Render dashboard create a **Web Service** and connect your GitHub repo.
   - Build command: `npm install && npm run build`
   - Start command: `npm start` (or `npm run dev` if you prefer TSX runtime).
   - Environment: set `NODE_ENV=production`.
3. Add environment variables in Render:
   - `USE_POSTGRES=true`
   - `DATABASE_URL` = either the **internal** connection string (e.g. `postgresql://coco_oiwh_user:...@dpg-...:5432/coco_oiwh`) or the **external** one; internal is faster and only reachable from Render services.
   - Optionally: `DB_SSL=true`, `ADMIN_NAME`, `ADMIN_PASSWORD`, etc.
4. (Optional) Create a managed PostgreSQL add‑on on Render and copy its URL into `DATABASE_URL`.
5. Open a shell to the database using `render psql <service-name>` or via the web console.

The server code reads `process.env.PORT` so Render’s assigned port is used automatically.

With this setup the app and database will run together on Render; migrations run on startup to create any missing tables or columns.
