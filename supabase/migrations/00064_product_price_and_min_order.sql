-- 00064_product_price_and_min_order.sql
--
-- A product gets its own price and minimum order.
--
-- Until now a listing carried no commercial figure at all: the public page
-- borrowed the COMPANY's free-text `moq` (one value for its whole catalogue)
-- and showed no price, so a buyer had to ask before knowing whether an offer
-- was even in range. Sellers asked to state both per product.
--
-- One selling unit serves both figures — "4.50 USD per kg, minimum 500 kg" —
-- which is how sellers quote and keeps the form to four inputs. Everything is
-- optional: a product without a price shows "price on request".
--
--   price               amount for ONE `sale_unit`, in `price_currency`
--   price_currency      USD (default, the currency of DRC trade), EUR or CDF
--   sale_unit           key of the unit ('kg', 'tonne', 'bag'…); the labels live
--                       in the i18n catalogs (ProductPricing.units), so the
--                       column only bounds the length and new units need no
--                       migration
--   min_order_quantity  smallest order accepted, counted in `sale_unit`
--
-- No policy change: the columns follow the row (owner + staff write, public
-- read when the company is verified and the product published — 00057).

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price              numeric(14, 2),
  ADD COLUMN IF NOT EXISTS price_currency     text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS sale_unit          text,
  ADD COLUMN IF NOT EXISTS min_order_quantity numeric(14, 2);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_price_check,
  DROP CONSTRAINT IF EXISTS products_price_currency_check,
  DROP CONSTRAINT IF EXISTS products_sale_unit_check,
  DROP CONSTRAINT IF EXISTS products_min_order_quantity_check,
  DROP CONSTRAINT IF EXISTS products_pricing_unit_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_price_check              CHECK (price IS NULL OR price >= 0),
  ADD CONSTRAINT products_price_currency_check     CHECK (price_currency IN ('USD', 'EUR', 'CDF')),
  ADD CONSTRAINT products_sale_unit_check          CHECK (sale_unit IS NULL OR sale_unit ~ '^[a-z0-9_]{1,30}$'),
  ADD CONSTRAINT products_min_order_quantity_check CHECK (min_order_quantity IS NULL OR min_order_quantity > 0),
  -- A figure without its unit means nothing ("4.50 per what?").
  ADD CONSTRAINT products_pricing_unit_check
    CHECK ((price IS NULL AND min_order_quantity IS NULL) OR sale_unit IS NOT NULL);

COMMENT ON COLUMN public.products.price IS
  'Price of one sale_unit, in price_currency. NULL = price on request.';
COMMENT ON COLUMN public.products.price_currency IS
  'ISO currency of price: USD, EUR or CDF.';
COMMENT ON COLUMN public.products.sale_unit IS
  'Unit key the product is sold by (kg, tonne, litre, piece, bag, carton, pallet, container, m3, m2); labels in the i18n catalogs.';
COMMENT ON COLUMN public.products.min_order_quantity IS
  'Smallest order accepted, counted in sale_unit. NULL = not stated.';
