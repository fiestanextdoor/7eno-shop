-- Klant-e-mail op de order. Nodig om de "je bestelling is onderweg"-mail te
-- kunnen sturen, ook voor gast-bestellingen (die hebben geen auth.users-account
-- om het adres uit te halen). Nullable: bestaande rijen hebben nog geen waarde.
alter table public.orders
  add column if not exists customer_email text;
