# Kripta on Render - Quick Start (5 Minutes)

## TL;DR - Deploy in 5 Steps

### 1. Create PostgreSQL Database on Render
```
Dashboard → New → PostgreSQL
Name: kripta-db
Region: Your choice
Plan: Standard
→ Create
```
Copy the connection string.

### 2. Create Web Service on Render
```
Dashboard → New → Web Service
Connect GitHub repository
Name: kripta-app
Build: pnpm install && pnpm build
Start: pnpm start
→ Create Web Service
```

### 3. Add Environment Variables
In Render Web Service settings, add:
```
DATABASE_URL=<your-postgres-connection-string>
NODE_ENV=production
JWT_SECRET=<random-string>
VITE_APP_ID=<your-manus-app-id>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=<your-owner-id>
OWNER_NAME=<your-name>
BUILT_IN_FORGE_API_URL=<your-forge-url>
BUILT_IN_FORGE_API_KEY=<your-forge-key>
VITE_FRONTEND_FORGE_API_URL=<your-frontend-forge-url>
VITE_FRONTEND_FORGE_API_KEY=<your-frontend-forge-key>
VITE_APP_TITLE=Kripta Asset Exchange
VITE_APP_LOGO=/kripta-logo.svg
```

### 4. Update OAuth Redirect URI
In Manus OAuth settings:
```
Add: https://<your-render-app>.onrender.com/api/oauth/callback
```

### 5. Run Migrations
After deployment completes:
```
Render Dashboard → Web Service → Shell
$ pnpm db:push
```

## Done! 🎉

Your app is now live at: `https://<your-render-app>.onrender.com`

## Need Help?

See `RENDER_DEPLOYMENT.md` for detailed instructions and troubleshooting.
