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
