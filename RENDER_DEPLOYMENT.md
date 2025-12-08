# Kripta Asset Exchange - Render Deployment Guide

This guide walks you through deploying Kripta Asset Exchange to Render.

## Prerequisites

- Render account (https://render.com)
- GitHub repository with your Kripta project
- Manus OAuth credentials (App ID, Portal URL, etc.)

## Step 1: Prepare Your Repository

1. Push your Kripta project to GitHub
2. Ensure `render.yaml` is in the root directory (already included)
3. Verify `package.json` has correct build and start scripts:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx watch server/_core/index.ts",
    "build": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

## Step 2: Create Render Database

1. Go to https://dashboard.render.com
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: kripta-db
   - **Database**: kripta
   - **User**: kripta_user
   - **Region**: Choose closest to your users
   - **Plan**: Standard (or Starter for testing)
4. Click **Create Database**
5. Copy the connection string (you'll need this)

## Step 3: Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: kripta-app
   - **Environment**: Node
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Plan**: Standard (or Starter for testing)
   - **Region**: Same as database

## Step 4: Configure Environment Variables

In the Render dashboard, add these environment variables:

### Required Variables

```
DATABASE_URL=<your-postgresql-connection-string-from-step-2>
NODE_ENV=production
JWT_SECRET=<generate-a-random-string>
VITE_APP_ID=<your-manus-app-id>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=<your-owner-id>
OWNER_NAME=<your-name>
BUILT_IN_FORGE_API_URL=<your-forge-api-url>
BUILT_IN_FORGE_API_KEY=<your-forge-api-key>
VITE_FRONTEND_FORGE_API_URL=<your-frontend-forge-url>
VITE_FRONTEND_FORGE_API_KEY=<your-frontend-forge-key>
VITE_APP_TITLE=Kripta Asset Exchange
VITE_APP_LOGO=/kripta-logo.svg
```

### Optional Variables

```
VITE_ANALYTICS_ENDPOINT=<your-analytics-endpoint>
VITE_ANALYTICS_WEBSITE_ID=<your-website-id>
```

## Step 5: Update OAuth Redirect URIs

1. Go to your Manus OAuth application settings
2. Add your Render domain to the redirect URIs:
   - `https://<your-render-app>.onrender.com/api/oauth/callback`
3. Save changes

## Step 6: Deploy

1. Click **Create Web Service** in Render
2. Render will automatically deploy from your GitHub repository
3. Monitor the deployment in the **Logs** tab
4. Once deployment is complete, your app will be live at `https://<your-render-app>.onrender.com`

## Step 7: Run Database Migrations

After deployment, run migrations on the Render database:

1. In Render dashboard, go to your Web Service
2. Click **Shell** tab
3. Run: `pnpm db:push`
4. This will create all necessary database tables

## Step 8: Verify Deployment

1. Visit `https://<your-render-app>.onrender.com`
2. Test the login flow
3. Verify dashboard loads correctly
4. Test a deposit/withdrawal transaction
5. Check the Markets and Trading pages

## Troubleshooting

### Build Fails

**Error**: `pnpm: command not found`
- **Solution**: Ensure Node version is 18+ in Render settings

**Error**: `DATABASE_URL is not set`
- **Solution**: Verify DATABASE_URL environment variable is correctly set in Render dashboard

### Database Connection Issues

**Error**: `connect ECONNREFUSED`
- **Solution**: 
  1. Verify DATABASE_URL is correct
  2. Ensure PostgreSQL database is in the same region
  3. Check database is in "Available" state

### OAuth Not Working

**Error**: `Invalid redirect_uri`
- **Solution**: 
  1. Verify redirect URI is added to Manus OAuth settings
  2. Ensure it matches exactly: `https://<your-render-app>.onrender.com/api/oauth/callback`

### Migrations Not Running

**Error**: Tables don't exist after deployment
- **Solution**: 
  1. SSH into Render Web Service
  2. Run: `pnpm db:push`
  3. Verify tables are created in database

## Monitoring & Maintenance

### View Logs

1. Go to your Render Web Service
2. Click **Logs** tab
3. Filter by date/time to find errors

### Update Application

1. Push changes to GitHub
2. Render automatically redeploys
3. Monitor deployment in Logs tab

### Database Backups

1. Go to your PostgreSQL database in Render
2. Click **Backups** tab
3. Enable automatic backups (recommended)

## Performance Tips

1. **Enable Auto-scaling**: Set max instances to 2-3 for traffic spikes
2. **Use Standard Plan**: Starter plan may have slow response times
3. **Monitor Metrics**: Check CPU and memory usage in Render dashboard
4. **Optimize Queries**: Review slow queries in database logs

## Custom Domain

1. Go to your Render Web Service
2. Click **Settings** tab
3. Under **Custom Domain**, add your domain
4. Follow DNS configuration instructions
5. Wait for SSL certificate to be issued (usually 5-10 minutes)

## Support

For Render-specific issues, visit: https://render.com/docs
For Kripta-specific issues, check the application logs in Render dashboard.

---

**Happy deploying! 🚀**
