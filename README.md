# Amber & Oak Cafe

Full-stack restaurant website portfolio project for a cafe, kopitiam, restaurant, or small food business.

## Stack

- React + Vite
- Tailwind CSS
- Supabase Database + Auth
- Netlify deployment
- PDF and Excel-compatible CSV report export

## Features

- Public landing page with hero, about, menu, gallery, promotion, reservation, location, contact, and WhatsApp CTAs.
- Supabase-backed contact messages, reservation requests, order requests, and menu data.
- Public menu uses Supabase when configured and falls back to demo content when env vars are missing.
- Admin login using Supabase Auth email/password.
- Admin dashboard with overview, reservations, contact messages, menu CRUD, orders, reports, analytics, PDF export, and Excel-compatible CSV export.
- Analytics include total revenue, monthly revenue, total orders, total customers, reservation stats, monthly sales chart, and top-selling menu items.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these values in `.env.local` after creating a Supabase project:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

Do not put a Supabase service-role or secret key in this frontend project.

## Supabase Setup

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql` for portfolio demo data.
5. Create an admin user in Supabase Auth.
6. In the user editor, set app metadata:

```json
{
  "role": "admin"
}
```

7. In Supabase Auth URL settings, add:
   - `http://localhost:5173`
   - `http://localhost:5173/admin`
   - Your Netlify production URL
   - Your Netlify production URL with `/admin`

The database uses Row Level Security. Public users can insert contact, reservation, and order records. Admin users can read and manage records only when their Supabase Auth `app_metadata.role` is `admin`.

## Admin Dashboard

Local URL:

```text
http://localhost:5173/admin
```

Production URL:

```text
https://your-netlify-site.netlify.app/admin
```

Admin pages:

- Overview
- Reservations
- Contact messages
- Menu CRUD
- Orders
- Daily, weekly, monthly, and yearly reports

## Backend Testing

1. Start the app with configured Supabase env vars.
2. Submit the public contact form.
3. Confirm a new row appears in `contact_messages`.
4. Submit the reservation form.
5. Confirm a new row appears in `reservations`.
6. Submit an order request.
7. Confirm rows appear in `orders` and `order_items`.
8. Log in to `/admin`.
9. Update reservation/order/message statuses.
10. Add, edit, and delete a menu item.
11. Open Reports and export PDF/Excel-compatible CSV files.

## Netlify Deployment

Netlify build settings are configured in `netlify.toml`.

- Build command: `npm run build`
- Publish directory: `dist`

Add these Netlify environment variables:

```bash
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

After deployment, add the Netlify URL to Supabase Auth redirect URLs.

## Checks

```bash
npm test
npm run lint
npm run build
```
