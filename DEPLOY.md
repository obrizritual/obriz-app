# OBRIZ PWA — Deployment Guide

## What You Have

A complete Progressive Web App with:
- 5 real audio sessions (your ElevenLabs recordings) with HTML5 playback
- Seekable audio player with progress tracking
- Nervous System Score tracking
- Daily check-in with personalized recommendations
- 4 micro-interventions (no audio needed)
- Shop page linking to your Gumroad
- Offline support via service worker
- "Add to Home Screen" capability on mobile

## Deploy to Vercel (Free) — Step by Step

### Option A: GitHub + Vercel (Recommended)

1. **Create a GitHub account** if you don't have one: https://github.com/signup

2. **Install Git** on your computer:
   - Windows: Download from https://git-scm.com/download/win
   - Mac: Open Terminal, type `git --version` (it will prompt to install)

3. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name it `obriz-app`
   - Keep it Private
   - Click "Create repository"

4. **Push your code** (open Terminal/Command Prompt in the `obriz-pwa` folder):
   ```
   git init
   git add .
   git commit -m "OBRIZ PWA initial release"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/obriz-app.git
   git push -u origin main
   ```

5. **Connect to Vercel:**
   - Go to https://vercel.com and sign up with your GitHub account
   - Click "Add New Project"
   - Import your `obriz-app` repository
   - Framework: **Vite**
   - Click "Deploy"

6. **Custom URL:**
   - Your app will be at `obriz-app.vercel.app`
   - In Vercel dashboard → Settings → Domains, you can try claiming `obriz.vercel.app`

### Option B: Vercel CLI (Faster, No GitHub Needed)

1. **Install Node.js:** https://nodejs.org (download LTS version)

2. **Install Vercel CLI:**
   ```
   npm install -g vercel
   ```

3. **Deploy** (open Terminal in the `obriz-pwa` folder):
   ```
   npm run build
   cd dist
   vercel --prod
   ```
   - It will ask you to log in (creates a free account)
   - Accept all defaults
   - Done! You'll get a URL like `obriz-pwa.vercel.app`

## After Deployment

### Make It Installable on Phones
- **iPhone:** Open the URL in Safari → tap Share → "Add to Home Screen"
- **Android:** Open in Chrome → tap the three dots → "Add to Home Screen" or "Install App"

### Share With Customers
- Link to your Vercel URL from your Gumroad product page
- Add it to your Instagram/TikTok bio: "Try the free app → [your-url]"
- The app works as a lead magnet — free sessions build trust, shop links to paid products

## Audio File Mapping

| Session | File | Duration |
|---------|------|----------|
| Morning Reset | morning-reset.mp3 | 2:59 |
| Pre-Meeting Reset | pre-meeting-reset.mp3 | 3:20 |
| The Transition | transition-reset.mp3 | 3:54 |
| Post-Conflict Reset | post-conflict-reset.mp3 | 3:14 |
| General Reset | general-reset.mp3 | 2:52 |

## Making Changes Later

Edit files in `src/ObrizApp.jsx`, then:
```
npm run build
```
If using GitHub: commit and push — Vercel auto-deploys.
If using Vercel CLI: run `vercel --prod` from the `dist` folder.
