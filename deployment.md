# Deployment Guide for TypingSprint

TypingSprint is a full-stack application with a React frontend and a Node.js/Socket.io backend. To ensure real-time features work correctly, you need to deploy the backend to a service that supports persistent WebSocket connections.

## Recommended Tech Stack
- **Frontend**: [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
- **Backend**: [Render](https://render.com) or [Railway](https://railway.app)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 1. Backend Deployment (Render)

Render is great for Node.js apps and supports WebSockets on their paid and free tiers (though free tier spun down after inactivity).

1. **Create a Render Account**: Connect your GitHub.
2. **New Web Service**: Select your `TypingSprint` repository.
3. **Configure Service**:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `PORT`: `10000` (or leave as default).
   - `NODE_ENV`: `production`
5. **Deploy**: Render will provide a URL like `https://typingsprint-api.onrender.com`.

---

## 2. Frontend Deployment (Vercel)

Vercel is optimized for React/Vite applications.

1. **Create a Vercel Project**: Connect your GitHub repo.
2. **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (Project root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - `VITE_API_URL`: The URL of your deployed backend (e.g., `https://typingsprint-api.onrender.com`).
4. **Deploy**: Vercel will provide a URL like `https://typingsprint.vercel.app`.

---

## 3. Important Notes

### CORS & Socket.io
The backend is already configured to allow CORS for any origin in production, which is suitable for initial deployment. If you want to tighten security, update the `cors` configuration in `server/server.js`.

### API/Socket Configuration
The project uses a centralized `src/config.js` file that automatically handles the mapping:
- It takes your `VITE_API_URL` and derives both the REST API path and the WebSocket path.
- In local development, it defaults to `http://localhost:5000`.

### Real-time Performance
When using a free tier for the backend (like Render's free tier), the first connection might be slow as the server "wakes up". For a production-ready "wow" experience, consider a small paid plan to keep the server always-on.
