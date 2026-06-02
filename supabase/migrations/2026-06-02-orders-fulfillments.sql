-- Multi-provider fulfillment: an order (one Stripe session) can be fulfilled by
-- one or more providers (Printful and/or Printify). Store each fulfillment as an
-- element of a jsonb array: { "provider": "...", "order_id": "...", "status": "..." }.
-- printful_order_id is kept for backward compatibility (populated from the
-- Printful entry when present).

alter table public.orders
  add column if not exists fulfillments jsonb not null default '[]';
