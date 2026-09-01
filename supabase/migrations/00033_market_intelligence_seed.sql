-- 00033: seed the market-intelligence data layer (design 11) so the Data Hub
-- dashboard renders KPI cards, the monthly trade-value trend and sector activity
-- with real rows. Idempotent — safe to re-run (conflict targets are the natural
-- keys defined in 00032). Companies-by-sector (donut) and provincial coverage
-- (map) stay derived live from `companies` and are not seeded here.

-- KPI cards -----------------------------------------------------------------
INSERT INTO public.market_metrics
  (key, label_en, label_fr, value_display, value_numeric, delta_pct, period_en, period_fr, sort_order)
VALUES
  ('total_trade_value', 'Total Trade Value (USD)', 'Valeur commerciale totale (USD)', '$24.8B', 24800000000, 15.6, 'vs. previous 12 months', 'vs. 12 mois précédents', 1),
  ('exports',           'Exports (USD)',           'Exportations (USD)',              '$15.7B', 15700000000, 12.4, 'vs. previous 12 months', 'vs. 12 mois précédents', 2),
  ('imports',           'Imports (USD)',           'Importations (USD)',              '$9.1B',   9100000000, 18.3, 'vs. previous 12 months', 'vs. 12 mois précédents', 3),
  ('active_companies',  'Active Companies',        'Entreprises actives',             '1,200+',  1200,        9.2,  'vs. previous 12 months', 'vs. 12 mois précédents', 4)
ON CONFLICT (key) DO UPDATE SET
  label_en = EXCLUDED.label_en,
  label_fr = EXCLUDED.label_fr,
  value_display = EXCLUDED.value_display,
  value_numeric = EXCLUDED.value_numeric,
  delta_pct = EXCLUDED.delta_pct,
  period_en = EXCLUDED.period_en,
  period_fr = EXCLUDED.period_fr,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Monthly trade-value trend (13 months, exports vs imports, USD) -------------
INSERT INTO public.trade_series (month, exports_usd, imports_usd) VALUES
  ('2023-05-01', 1080000000, 620000000),
  ('2023-06-01', 1120000000, 640000000),
  ('2023-07-01', 1150000000, 660000000),
  ('2023-08-01', 1210000000, 690000000),
  ('2023-09-01', 1180000000, 710000000),
  ('2023-10-01', 1260000000, 720000000),
  ('2023-11-01', 1300000000, 760000000),
  ('2023-12-01', 1340000000, 780000000),
  ('2024-01-01', 1290000000, 800000000),
  ('2024-02-01', 1370000000, 820000000),
  ('2024-03-01', 1420000000, 860000000),
  ('2024-04-01', 1480000000, 900000000),
  ('2024-05-01', 1560000000, 940000000)
ON CONFLICT (month) DO UPDATE SET
  exports_usd = EXCLUDED.exports_usd,
  imports_usd = EXCLUDED.imports_usd;

-- Sector activity (trade value, USD) for the horizontal bar chart -----------
-- No natural unique key on this table, so clear + reseed to stay idempotent.
DELETE FROM public.sector_activity;
INSERT INTO public.sector_activity (label_en, label_fr, trade_value_usd, sort_order) VALUES
  ('Mining',               'Mines',                 10500000000, 1),
  ('Agriculture',          'Agriculture',            4200000000, 2),
  ('Energy',               'Énergie',                3600000000, 3),
  ('Manufacturing',        'Industrie',              2600000000, 4),
  ('Construction',         'Construction',           1900000000, 5),
  ('Transport & Logistics','Transport et logistique',1500000000, 6);
