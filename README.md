# Coen - Family Blog

A private family blog built with Next.js and Supabase to share precious moments and milestones.

## Features

- 🔐 **Private Family Access** - Invite-only with secure authentication
- 📸 **Multi-Image Posts** - Upload multiple photos with captions
- 💬 **Family Comments** - Let everyone share their thoughts
- 📱 **Mobile First** - Optimized for posting from your phone
- 🎯 **Milestone Tracking** - Categorize special moments

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **Deployment**: Vercel

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the app.
