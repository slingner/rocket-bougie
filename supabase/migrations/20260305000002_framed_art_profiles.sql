-- Add framed art shipping profiles (ships in individual boxes, not flat envelopes)
insert into shipping_profiles (name, description, base_price, additional_price, pounds, length_in, width_in, height_in, sort_order) values
  ('Framed 8×10', 'Ships in 10.5×8.5×1" box (USPS Priority Mail)', 8.50, 8.50, 0.85, 10.5, 8.5, 1.0, 4),
  ('Framed 11×14', 'Ships in 15×12×1" box (USPS Priority Mail)', 9.50, 9.50, 1.0, 15.0, 12.0, 1.0, 5);
