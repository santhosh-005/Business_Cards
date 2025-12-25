# Business Card Manager

Minimal business card management app with Supabase and Tailwind CSS.

## Setup Instructions

### 1. Environment Variables

Update the `.env` file with your Supabase credentials:

```env
# Get these from your Supabase Project Settings -> API
VITE_SUPABASE_URL=https://ojkmnklzpfsrxzogwjfh.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Database Setup

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `setup-database.sql`
4. Run the SQL script

### 3. Storage Bucket Setup

1. Go to Storage in your Supabase Dashboard
2. Create a new bucket named `business-cards`
3. Make it **public** or set appropriate policies
4. Example policy for public bucket:
   - Policy name: "Public Access"
   - Allowed operations: SELECT, INSERT
   - Policy definition: `true`

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

## Features

- Add business cards via image upload or manual entry
- View all cards in a grid layout
- Click cards to see full details
- Delete cards
- Responsive design for mobile and desktop
- Clean white UI with Tailwind CSS

## Tech Stack

- React + Vite
- Tailwind CSS
- Supabase (Database + Storage)
- PostgreSQL
