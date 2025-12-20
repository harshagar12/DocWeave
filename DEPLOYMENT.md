# Deployment Guide

This guide explains how to deploy DocWeave using **Vercel** (Frontend) and **Render** (Backend).

## 1. Backend Deployment (Render)

1.  Create a new **Web Service** on [Render](https://render.com/).
2.  Connect your GitHub repository.
3.  Use the following settings:
    - **Root Directory**: `backend`
    - **Runtime**: Python 3
    - **Build Command**: `pip install -r requirements.txt`
    - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4.  Add Environment Variables:
    - `PYTHON_VERSION`: `3.9.0` (or your preferred version)
    - `FRONTEND_URL`: `https://your-vercel-app.vercel.app` (You'll get this after deploying frontend, you can update it later)

> **Note**: Render's free tier spins down after inactivity. The first request might take a minute. Also, files in `uploads/` are ephemeral and will be lost on restart.

## 2. Frontend Deployment (Vercel)

1.  Import your project into [Vercel](https://vercel.com/).
2.  Select the **Root Directory** as `frontend`.
3.  Vercel should auto-detect Vite.
4.  Add Environment Variables:
    - `VITE_API_URL`: `https://your-render-app.onrender.com` (The URL from step 1)
5.  Deploy!

## 3. Final Configuration

Once both are deployed:

1.  Go back to Render dashboard.
2.  Update the `FRONTEND_URL` variable with your actual Vercel URL.
3.  Redeploy the backend (or it might auto-deploy).

Now your app is live!
