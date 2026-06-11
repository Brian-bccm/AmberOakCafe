insert into public.menu_items (name, description, price, category, tag, image_url, is_available, display_order)
values
  ('Truffle Mushroom Toast', 'Sourdough, whipped ricotta, sauteed mushrooms, truffle oil, herbs.', 28, 'Brunch', 'Signature', null, true, 1),
  ('Smoked Duck Benedict', 'Poached eggs, smoked duck, hollandaise, spinach, toasted brioche.', 34, 'Brunch', 'Brunch', null, true, 2),
  ('Nasi Lemak Croffle', 'Buttery croffle, sambal, fried chicken bites, ikan bilis, cucumber.', 26, 'Local Fusion', 'Local Twist', null, true, 3),
  ('Sea Salt Gula Melaka Latte', 'Double espresso, fresh milk, gula melaka syrup, sea salt cream.', 16, 'Coffee', 'Coffee', null, true, 4),
  ('Charred Chicken Pesto Bowl', 'Grilled chicken, herbed rice, pesto, roasted greens, toasted seeds.', 31, 'Lunch', 'Lunch', null, true, 5),
  ('Burnt Cheesecake Slice', 'Creamy Basque-style cheesecake with berry compote and citrus zest.', 18, 'Dessert', 'Dessert', null, true, 6)
on conflict do nothing;

insert into public.reservations (customer_name, phone, email, reservation_date, reservation_time, guests, notes, status, created_at)
values
  ('Aina Rahman', '012-345 6789', 'aina@example.com', current_date + 1, '19:30', 4, 'Window table if available.', 'confirmed', now() - interval '2 days'),
  ('Daniel Lee', '013-888 2211', 'daniel@example.com', current_date + 3, '12:00', 2, 'Birthday brunch.', 'pending', now() - interval '1 day')
on conflict do nothing;

with created_order as (
  insert into public.orders (customer_name, phone, email, order_type, status, subtotal, notes, created_at)
  values ('Mei Wong', '016-222 7788', 'mei@example.com', 'pickup', 'completed', 62, 'Pickup at 1pm.', now() - interval '5 days')
  returning id
)
insert into public.order_items (order_id, item_name, unit_price, quantity)
select id, 'Smoked Duck Benedict', 34, 1 from created_order
union all
select id, 'Truffle Mushroom Toast', 28, 1 from created_order;

with created_order as (
  insert into public.orders (customer_name, phone, email, order_type, status, subtotal, notes, created_at)
  values ('Farid Omar', '019-555 1200', 'farid@example.com', 'pickup', 'completed', 48, 'No cutlery needed.', now() - interval '12 days')
  returning id
)
insert into public.order_items (order_id, item_name, unit_price, quantity)
select id, 'Sea Salt Gula Melaka Latte', 16, 3 from created_order;
