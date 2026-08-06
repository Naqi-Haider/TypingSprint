# TypingSprint Deployment & Environment Setup Guide

This guide provides step-by-step instructions for deploying **TypingSprint** (Frontend on Netlify/Vercel, Backend on Render, Database & Auth on Supabase).

---

## Step 1: Supabase Setup (Database & Authentication)

1. **Create a Supabase Project**:
   - Sign in to [Supabase](https://supabase.com).
   - Click **New Project**, enter a project name, database password, and choose a region.

2. **Run SQL Database Schema**:
   - Open your project dashboard and go to **SQL Editor**.
   - Copy the contents of [`supabase_schema.sql`](file:///home/naqi/Desktop/Projects/TS/supabase_schema.sql) from this repository.
   - Paste it into the SQL Editor and click **Run**.
   - This creates:
     - `profiles` table (linked to `auth.users`)
     - `user_stats` table (tracking WPM, games, accuracy, hours)
     - `lobbies` table (multiplayer room discovery)
     - Row Level Security (RLS) policies
     - Automated `handle_new_user` trigger on signup.

3. **Get API Credentials**:
   - In Supabase, go to **Project Settings -> API**.
   - Note down:
     - **Project URL** (`https://<project-ref>.supabase.co`)
     - **anon / public key**
     - **service_role key** *(Keep secret! Use on backend server only)*

---

## Step 2: Backend Server Deployment (Render)

1. **Create Web Service on Render**:
   - Connect your GitHub repository `TypingSprint` to [Render](https://render.com).
   - Set **Root Directory**: `server`
   - Set **Build Command**: `npm install`
   - Set **Start Command**: `node server.js`

2. **Configure Backend Environment Variables**:
   Add the following variables in the Render dashboard (**Environment** tab):

   | Key | Description | Example |
   | :--- | :--- | :--- |
   | `PORT` | Server Port | `5000` |
   | `SUPABASE_URL` | Supabase Project URL | `https://xyz.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `ey...` |
   | `SUPABASE_ANON_KEY` | Supabase Anon Key | `ey...` |
   | `CLIENT_URL` | Frontend URL for CORS | `https://typingsprint.netlify.app` |
   | `FRONTEND_URL` | Alternative CORS domain | `https://typingsprint.netlify.app` |
   | `MONGO_URI` | *(Optional)* MongoDB URI | `mongodb+srv://...` |

---

## Step 3: Frontend Deployment (Netlify / Vercel)

1. **Import Repository**:
   - Connect `TypingSprint` to [Netlify](https://netlify.com) or [Vercel](https://vercel.com).
   - Set **Build Command**: `npm run build`
   - Set **Publish Directory**: `dist`

2. **Configure Frontend Environment Variables**:
   Add the following build/runtime variables in Netlify / Vercel site settings:

   | Key | Description | Example |
   | :--- | :--- | :--- |
   | `VITE_SUPABASE_URL` | Supabase Project URL | `https://xyz.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key | `ey...` |
   | `VITE_SOCKET_URL` | Render Backend URL | `https://typing-sprint-api.onrender.com` |
   | `VITE_API_URL` | Express API Endpoint | `https://typing-sprint-api.onrender.com/api` |

---

## Step 4: Verification & Smoke Test

1. **Authentication**: Sign up a new user on the frontend. Check **Supabase Auth -> Users** and **Table Editor -> profiles** to verify automatic row insertion.
2. **Stats Update**: Play a single-player game. Check **Table Editor -> user_stats** to verify WPM/accuracy updates.
3. **Multiplayer Gameplay**: Open two browser tabs, create a lobby, join, and type simultaneously to verify real-time Socket.IO WebSocket sync and server gameplay logic.
