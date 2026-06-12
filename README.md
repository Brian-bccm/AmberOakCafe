# Amber & Oak Cafe

Business-ready restaurant website and lightweight management system for a small cafe, kopitiam, or restaurant.

Live site: https://amber-oak-cafe-brian-bccm.netlify.app

Admin: https://amber-oak-cafe-brian-bccm.netlify.app/admin

## Project Overview

Amber & Oak Cafe is a React + Supabase + Netlify project built as a realistic freelance deliverable. It includes a public marketing website, real enquiry/reservation/order persistence, staff login, admin management screens, reporting, and export tools.

## Tech Stack

- React + Vite
- Tailwind CSS
- Supabase Database, Auth, REST API, Storage, and Row Level Security
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
- Review form saves to `reviews` as pending and only approved reviews appear publicly.
- Menu loads from Supabase and falls back to clearly demo seed content when Supabase is not configured.
- Business settings load from Supabase so each client can edit restaurant name, contact info, WhatsApp messages, homepage copy, SEO text, opening hours, and payment instructions without code changes.
- Gallery and promotions can be managed from the admin dashboard.
- Supabase Storage bucket `restaurant-assets` is used for menu, gallery, promotion, hero, about, and payment QR images.
- Admin login uses Supabase Auth and `app_metadata.role = "admin"`, `"manager"`, or `"staff"`.
- Admin dashboard includes overview metrics, recent activity, business settings, reservations, messages, reviews, menu CRUD, gallery, promotions, admin order creation, payments, reports, audit logs, PDF export, and CSV export.
- Payment Management tracks manual cash/card/bank/eWallet/QR payments, links payments to orders, and generates printable receipts.
- Audit logs track important staff actions such as reservation, review, menu, order, payment, business settings, and report changes.

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

Supported roles:

- `admin`: full access, including audit logs.
- `manager`: business/content/operations access, excluding audit logs.
- `staff`: reservations, orders, and payments operations.

7. Add these Auth redirect URLs:

```text
http://localhost:5173
http://localhost:5173/admin
http://localhost:5173/admin/login
https://your-netlify-site.netlify.app
https://your-netlify-site.netlify.app/admin
https://your-netlify-site.netlify.app/admin/login
```

8. Confirm Supabase Storage has a public bucket named `restaurant-assets`. The schema file creates it automatically when run with sufficient permissions.

## SQL Schema

Core tables:

- `menu_items`: public menu catalog and admin-managed product data.
- `reservations`: customer reservation requests.
- `contact_messages`: customer enquiries.
- `orders`: order header, subtotal, order status, payment status, and notes.
- `order_items`: order lines, quantity, item price, customizations, and item notes.
- `payment_records`: manual/admin payment tracking linked to orders where applicable.
- `reviews`: customer ratings and comments with moderation status.
- `audit_logs`: staff activity records.
- `payment_gateway_events`: placeholder event table for future online payment gateways.
- `business_settings`: editable client business profile, SEO, WhatsApp templates, location, opening hours, and payment instructions.
- `gallery_items`: admin-managed public gallery images and captions.
- `promotions`: admin-managed public offers and campaign copy.

Storage:

- `restaurant-assets`: public-read image bucket.
- Authenticated admins can upload, update, and delete images.
- Public users can only read published image URLs.

Security:

- Row Level Security is enabled on all public tables.
- Public users can only view available menu items.
- Public users can view published gallery items, active promotions, and public business display settings.
- Public users can insert reservations, contact messages, orders, and order items.
- Public users can insert pending reviews and view approved reviews.
- Public users cannot read private reservations, messages, orders, or payments.
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
5. Submit a review and confirm it appears as pending.
6. Log in as admin.
7. Search/filter reservations, update status, and delete a test reservation.
8. Search/filter messages, mark read/replied, and delete a test message.
9. Approve/hide/delete a review and confirm only approved reviews show publicly.
10. Add, edit, hide, and delete a test menu item.
11. Upload a menu image and confirm it appears in the menu record.
12. Update Business Settings and confirm public name, phone, WhatsApp message, address, opening hours, service charge, tax, social links, and SEO text update after refresh.
13. Add/edit/hide a gallery item and confirm the public gallery updates.
14. Add/edit/deactivate a promotion and confirm the public promotion updates.
15. Create an admin order and confirm subtotal, service charge, tax, and total.
16. Submit an order and confirm payment instructions or QR details appear when enabled.
17. Update order status and payment status.
18. Add a manual payment record and link it to an order.
19. Confirm completed orders have a `Paid` payment or confirm cash payment during completion.
20. Print a receipt from a paid payment/order and confirm item lines/totals/reference display.
21. Export daily, weekly, monthly, and yearly reports.
22. Confirm audit log records reservation/order/payment/menu/review/report actions.

## Client Handoff Workflow

For a real restaurant client, the normal setup is:

1. Replace business details in Admin > Business Settings.
2. Set the client's WhatsApp number without `+`, spaces, or dashes, for example `60123456789`.
3. Edit WhatsApp message templates for reservations, orders, contact, and promotions.
4. Upload real hero/about/gallery/menu/promotion images.
5. Update menu categories, descriptions, prices, availability, and customization options.
6. Add active promotion campaigns.
7. Configure payment instructions and upload a DuitNow/bank/eWallet QR image if the business uses one.
8. Create owner/staff admin accounts in Supabase Auth and set `app_metadata.role = "admin"`.

## Payment Template Notes

This project is gateway-ready but does not process cards or eWallet charges directly yet.

Current payment model:

- Manual/admin payment tracking.
- Payment gateway placeholder providers: Stripe, Billplz, SenangPay, ToyyibPay, and iPay88.
- Payment methods: Cash, Credit/Debit Card, Online Bank Transfer, TNG eWallet, GrabPay, DuitNow QR, Other.
- Payment statuses: Pending, Paid, Failed, Refunded, Cancelled.
- Paid revenue in reports comes from `payment_records` with status `Paid`.
- Public order confirmation can show payment instructions and QR image from Business Settings.

Future live payment gateway:

- Add Stripe, Billplz, ToyyibPay, iPay88, or another provider through Netlify Functions or Supabase Edge Functions.
- Do not put gateway secret keys in frontend code or public database rows.
- Keep frontend provider fields as display/config placeholders only.
- Store payment provider secrets only in Netlify Functions or Supabase Edge Functions.

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
- Customer reviews and moderation: complete.
- Role-based admin access: complete.
- Audit log: complete.
- Contact message management: complete.
- Menu CRUD: complete.
- Order and payment status management: complete.
- Manual Payment Management: complete.
- Business Settings CMS: complete.
- Gallery CMS: complete.
- Promotions CMS: complete.
- Supabase Storage image upload UI: complete.
- Manual payment instruction and QR template: complete.
- Service charge/tax settings: complete.
- Payment gateway placeholder layer: complete.
- Printable paid-order receipts: complete.
- Sales reports and exports: complete.
- RLS and public/private data separation: complete.
- Netlify production deployment: complete.

## Remaining Production Notes

- Replace placeholder restaurant name, address, email, phone number, photos, menu, and pricing for each real client.
- Add a real payment gateway through backend functions if the business wants online payment collection.
- Add email/SMS notifications if the restaurant needs staff alerts.
- For high traffic or abuse-prone sites, add CAPTCHA or server-side rate limiting.
