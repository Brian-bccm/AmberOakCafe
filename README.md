# Amber & Oak Cafe

Business-ready restaurant website and lightweight management system for a small cafe, kopitiam, or restaurant.

Live site: https://amber-oak-cafe-brian-bccm.netlify.app

Admin: https://amber-oak-cafe-brian-bccm.netlify.app/admin

## Project Overview

Amber & Oak Cafe is a React + Supabase + Netlify project built as a realistic freelance deliverable. It includes a public marketing website, real enquiry/reservation/order persistence, staff login, admin management screens, reporting, and export tools.

## Tech Stack

- React + Vite
- Tailwind CSS
- Supabase Database, Auth, REST API, and Row Level Security
- Netlify hosting and SPA redirects
- Recharts for dashboard charts
- jsPDF and CSV export for reports

## Main Features

- Public homepage with hero, about, menu, order enquiry, gallery, promotion, reservation, location, contact, and footer.
- Mobile responsive layout with sticky navigation and clear CTA buttons.
- WhatsApp links use `wa.me` with pre-filled customer messages.
- Contact form saves to `contact_messages`.
- Reservation form saves to `reservations`.
- Order form saves to `orders` and `order_items`, including item notes and customizations.
- Menu loads from Supabase and falls back to clearly demo seed content when Supabase is not configured.
- Admin login uses Supabase Auth and `app_metadata.role = "admin"`.
- Admin dashboard includes overview metrics, recent activity, reservations, messages, menu CRUD, orders, reports, PDF export, and CSV export.

## Environment Variables

Create `.env.local` for local development:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
VITE_RESTAURANT_WHATSAPP_NUMBER=60123456789
VITE_RESTAURANT_PHONE_DISPLAY=+60 12-345 6789
VITE_RESTAURANT_EMAIL=hello@amberandoak.example
VITE_RESTAURANT_ADDRESS=28, Jalan Telawi, Bangsar, 59100 Kuala Lumpur
```

Never expose a Supabase service-role key in this frontend project.

## Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Optionally run `supabase/seed.sql` for demo data.
5. Create an Auth user for the restaurant owner or staff.
6. Set the user app metadata:

```json
{
  "role": "admin"
}
```

7. Add these Auth redirect URLs:

```text
http://localhost:5173
http://localhost:5173/admin
http://localhost:5173/admin/login
https://your-netlify-site.netlify.app
https://your-netlify-site.netlify.app/admin
https://your-netlify-site.netlify.app/admin/login
```

## SQL Schema

Core tables:

- `menu_items`: public menu catalog and admin-managed product data.
- `reservations`: customer reservation requests.
- `contact_messages`: customer enquiries.
- `orders`: order header, subtotal, order status, payment status, and notes.
- `order_items`: order lines, quantity, item price, customizations, and item notes.

Security:

- Row Level Security is enabled on all public tables.
- Public users can only view available menu items.
- Public users can insert reservations, contact messages, orders, and order items.
- Public users cannot read private reservations, messages, or orders.
- Admin access is controlled by Supabase Auth app metadata: `role = admin`.

## Local Testing

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
http://localhost:5173/admin
http://localhost:5173/admin/login
```

Recommended checks:

1. Submit contact form and confirm a row appears in `contact_messages`.
2. Submit reservation form and confirm a row appears in `reservations`.
3. Submit order form and confirm rows appear in `orders` and `order_items`.
4. Confirm WhatsApp buttons open `wa.me` links with pre-filled messages.
5. Log in as admin.
6. Search/filter reservations, update status, and delete a test reservation.
7. Search/filter messages, mark read/replied, and delete a test message.
8. Add, edit, hide, and delete a test menu item.
9. Confirm the public menu updates after admin menu changes.
10. Update order status and payment status.
11. Export daily, weekly, monthly, and yearly reports.

## Deployment

Netlify settings are stored in `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

The SPA redirect is configured so `/admin` and `/admin/login` work after refresh:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Add the same environment variables in Netlify Site Settings > Environment Variables.

Production verification:

```bash
npm test
npm run lint
npm run build
```

## Business-Ready Checklist

- Public website sections: complete.
- Mobile responsive layout: complete.
- WhatsApp CTAs: complete and env-configurable.
- Supabase persistence: complete.
- Admin authentication: complete.
- Reservation management: complete.
- Contact message management: complete.
- Menu CRUD: complete.
- Order and payment status management: complete.
- Sales reports and exports: complete.
- RLS and public/private data separation: complete.
- Netlify production deployment: complete.

## Remaining Production Notes

- Replace placeholder restaurant name, address, email, phone number, photos, menu, and pricing for each real client.
- Add a real payment gateway if the business wants online payment collection.
- Add email/SMS notifications if the restaurant needs staff alerts.
- For high traffic or abuse-prone sites, add CAPTCHA or server-side rate limiting.
