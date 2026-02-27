-- The original policy only allowed access via customer_id, but orders placed
-- as a guest (or via Stripe checkout) have customer_id = null.
-- Allow customers to also read orders that match their account email.

drop policy "Customers can read own orders" on orders;

create policy "Customers can read own orders"
  on orders for select using (
    auth.uid() = customer_id
    or email = (auth.jwt() ->> 'email')
  );

-- Same fix for order items — the existing policy joins through orders,
-- so it will inherit the fix automatically. No change needed there.
