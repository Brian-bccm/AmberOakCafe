insert into public.menu_items (name, description, price, category, tag, image_url, customization_options, is_available, display_order)
values
  ('Truffle Mushroom Toast', 'Sourdough, whipped ricotta, sauteed mushrooms, truffle oil, herbs.', 28, 'Brunch', 'Signature', null, '[{"name":"Add peanut","choices":["No","Yes"]}]'::jsonb, true, 1),
  ('Smoked Duck Benedict', 'Poached eggs, smoked duck, hollandaise, spinach, toasted brioche.', 34, 'Brunch', 'Brunch', null, '[]'::jsonb, true, 2),
  ('Nasi Lemak Croffle', 'Buttery croffle, sambal, fried chicken bites, ikan bilis, cucumber.', 26, 'Local Fusion', 'Local Twist', null, '[{"name":"Spicy level","choices":["Normal","Less spicy","Extra spicy"]}]'::jsonb, true, 3),
  ('Sea Salt Gula Melaka Latte', 'Double espresso, fresh milk, gula melaka syrup, sea salt cream.', 16, 'Coffee', 'Coffee', null, '[]'::jsonb, true, 4),
  ('Charred Chicken Pesto Bowl', 'Grilled chicken, herbed rice, pesto, roasted greens, toasted seeds.', 31, 'Lunch', 'Lunch', null, '[]'::jsonb, true, 5),
  ('Burnt Cheesecake Slice', 'Creamy Basque-style cheesecake with berry compote and citrus zest.', 18, 'Dessert', 'Dessert', null, '[]'::jsonb, true, 6)
on conflict do nothing;

insert into public.reservations (customer_name, phone, email, reservation_date, reservation_time, guests, notes, status, created_at)
values
  ('Aina Rahman', '012-345 6789', 'aina@example.com', current_date + 1, '19:30', 4, 'Window table if available.', 'confirmed', now() - interval '2 days'),
  ('Daniel Lee', '013-888 2211', 'daniel@example.com', current_date + 3, '12:00', 2, 'Birthday brunch.', 'pending', now() - interval '1 day')
on conflict do nothing;

with created_order as (
  insert into public.orders (customer_name, phone, email, order_type, status, payment_status, subtotal, notes, created_at)
  values ('Mei Wong', '016-222 7788', 'mei@example.com', 'pickup', 'completed', 'Paid', 62, 'Pickup at 1pm.', now() - interval '5 days')
  returning id
)
insert into public.order_items (order_id, item_name, unit_price, quantity, customizations, notes)
select id, 'Smoked Duck Benedict', 34, 1, '{}'::jsonb, 'Hollandaise on the side.' from created_order
union all
select id, 'Truffle Mushroom Toast', 28, 1, '{"Add peanut":"No"}'::jsonb, null from created_order;

with paid_order as (
  select id, customer_name, subtotal, created_at from public.orders where customer_name = 'Mei Wong' order by created_at desc limit 1
)
insert into public.payment_records (order_id, customer_name, amount, payment_method, payment_status, transaction_reference, payment_date, notes)
select id, customer_name, subtotal, 'Credit/Debit Card', 'Paid', 'DEMO-CARD-1001', created_at, 'Demo card payment.' from paid_order
where not exists (select 1 from public.payment_records where transaction_reference = 'DEMO-CARD-1001');

with created_order as (
  insert into public.orders (customer_name, phone, email, order_type, status, payment_status, subtotal, notes, created_at)
  values ('Farid Omar', '019-555 1200', 'farid@example.com', 'pickup', 'completed', 'Paid', 48, 'No cutlery needed.', now() - interval '12 days')
  returning id
)
insert into public.order_items (order_id, item_name, unit_price, quantity, customizations, notes)
select id, 'Sea Salt Gula Melaka Latte', 16, 3, '{}'::jsonb, 'Less sweet.' from created_order;

with paid_order as (
  select id, customer_name, subtotal, created_at from public.orders where customer_name = 'Farid Omar' order by created_at desc limit 1
)
insert into public.payment_records (order_id, customer_name, amount, payment_method, payment_status, transaction_reference, payment_date, notes)
select id, customer_name, subtotal, 'DuitNow QR', 'Paid', 'DEMO-DUITNOW-1002', created_at, 'Demo QR payment.' from paid_order
where not exists (select 1 from public.payment_records where transaction_reference = 'DEMO-DUITNOW-1002');

insert into public.business_settings (id, settings)
values (
  'default',
  '{
    "name": "Amber & Oak Cafe",
    "brandLabel": "Premium cafe",
    "tagline": "All-day brunch, craft coffee, and warm hospitality in Bangsar.",
    "shortDescription": "A warm, premium cafe website and operations template for real restaurant clients.",
    "aboutTitle": "A neighborhood cafe designed for slow mornings and polished casual dining.",
    "aboutCopy": "Amber & Oak Cafe is a premium but approachable dining spot built for small celebrations, client catch-ups, and everyday coffee rituals. The menu keeps familiar brunch favorites while adding local flavors that work well for Kuala Lumpur customers.",
    "aboutImageUrl": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1100&q=80",
    "aboutBadgeTitle": "Since 2022",
    "aboutBadgeText": "Built for great coffee, honest plates, and repeat customers.",
    "heroEyebrow": "Bangsar all-day brunch and coffee bar",
    "heroTitle": "Amber & Oak Cafe",
    "heroCopy": "All-day brunch, craft coffee, and warm hospitality in Bangsar.",
    "heroImageUrl": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=80",
    "heroPrimaryLabel": "View Menu",
    "heroSecondaryLabel": "Order or Reserve",
    "phoneDisplay": "+60 12-345 6789",
    "phoneRaw": "60123456789",
    "email": "hello@amberandoak.example",
    "address": "28, Jalan Telawi, Bangsar, 59100 Kuala Lumpur",
    "mapUrl": "https://www.google.com/maps/search/?api=1&query=Jalan%20Telawi%203%20Bangsar%20Kuala%20Lumpur",
    "openingHoursText": "Monday - Friday: 7:00 AM - 9:30 PM\nSaturday - Sunday: 8:00 AM - 10:30 PM\nPublic holidays: 8:00 AM - 8:00 PM",
    "footerText": "All-day brunch, craft coffee, and warm hospitality in Bangsar.",
    "seoTitle": "Amber & Oak Cafe | Brunch, Coffee, Reservations & Orders",
    "seoDescription": "Modern restaurant website with menu, orders, reservations, WhatsApp enquiries, admin dashboard, payments, and reports.",
    "reservationWhatsAppMessage": "Hi {name}, I would like to make a reservation.",
    "orderWhatsAppMessage": "Hi {name}, I would like to place an order.",
    "contactWhatsAppMessage": "Hi {name}, I have a general enquiry.",
    "promotionWhatsAppMessage": "Hi {name}, I would like to claim the current promotion.",
    "paymentInstructionsEnabled": true,
    "paymentInstructions": "Payment can be made by cash, card, online transfer, TNG eWallet, GrabPay, or DuitNow QR. Please send the receipt/reference number after payment.",
    "paymentQrImageUrl": "",
    "paymentEnabledMethods": "Cash, Credit/Debit Card, Online Bank Transfer, TNG eWallet, GrabPay, DuitNow QR",
    "provider": "manual",
    "providerMode": "manual",
    "providerPublicLabel": "Manual payment tracking"
  }'::jsonb
)
on conflict (id) do nothing;

insert into public.gallery_items (title, image_url, alt_text, is_published, display_order)
values
  ('Coffee bar', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80', 'Barista preparing coffee behind a cafe counter', true, 1),
  ('Cafe interior', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80', 'Warm modern cafe interior with tables and pendant lights', true, 2),
  ('Brunch plates', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80', 'Colorful brunch plate with vegetables and grains', true, 3),
  ('Kitchen craft', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80', 'Chef plating a premium dish in a restaurant kitchen', true, 4)
on conflict do nothing;

insert into public.promotions (title, description, offer_text, image_url, whatsapp_message, is_active, display_order)
values (
  'Weekend Brunch Set',
  'Any brunch main, dessert slice, and signature iced latte for two guests.',
  'RM 88',
  null,
  'Hi {name}, I would like to claim the Weekend Brunch Set promotion.',
  true,
  1
)
on conflict do nothing;
