# Deployment Guide

## Step 1: Deploy Backend to Render.com

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click "New +" → "Web Service"
3. Select your GitHub repository (`flatexpense`)
4. Configure the deployment:
   - **Name**: `flatexpense-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Runtime**: `Node 18+`

5. Add Environment Variables:
   - `FRONTEND_URL` = `https://maximi-k3lz.vercel.app`
   - `NODE_ENV` = `production`

6. Click "Create Web Service"
7. Wait for deployment to complete (~2-3 minutes)
8. **Copy the generated URL** (e.g., `https://flatexpense-backend.onrender.com`)

## Step 2: Update Frontend API Configuration

1. Open `frontend/.env.production`
2. Replace `YOUR_BACKEND_URL` with your Render.com backend URL
   ```
   VITE_API_URL=https://flatexpense-backend.onrender.com/api
   ```

## Step 3: Redeploy Frontend on Vercel

1. Commit and push changes to GitHub:
   ```bash
   git add .
   git commit -m "Configure backend API for production"
   git push
   ```

2. Vercel will automatically redeploy your frontend

## Step 4: Verify Everything Works

1. Visit `https://maximi-k3lz.vercel.app`
2. Add members and expenses
3. Confirm data is persisting in the backend

## Notes

- The backend uses file-based storage (`data.json`) by default
- All data is stored on the Render.com server
- The Render.com free tier may have some cold-start delays
- For production, consider upgrading to a paid plan or using a database

## Troubleshooting

If expenses aren't saving:
1. Check browser console for API errors
2. Verify the `VITE_API_URL` is correct
3. Check Render.com logs for backend errors
