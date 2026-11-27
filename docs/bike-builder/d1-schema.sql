-- Draft Cloudflare D1 schema for a later phase.
-- Phase 1 does not create a database. JSON in data/builder/ maps 1:1 onto these columns.
-- Do not run this against production from the Bike Builder pull request.

CREATE TABLE parts (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  model_code TEXT,
  years TEXT,
  specs_json TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  quote TEXT,
  checked_at TEXT NOT NULL,
  review_status TEXT NOT NULL CHECK (review_status IN ('draft', 'approved')),
  attribution TEXT
);

CREATE TABLE rules (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  slots_json TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('incompatible', 'warning', 'cannot_verify')),
  predicate_json TEXT NOT NULL,
  message_adult TEXT NOT NULL,
  message_kid TEXT NOT NULL,
  fix TEXT,
  source_url TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  provenance TEXT NOT NULL CHECK (provenance IN ('manufacturer_spec', 'industry_standard', 'practitioner_rule'))
);

CREATE TABLE bikes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bike_type TEXT,
  wheel_size TEXT,
  kit_name TEXT,
  asin TEXT,
  note TEXT,
  slots_json TEXT NOT NULL
);

CREATE TABLE builds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bike_type TEXT,
  wheel_size TEXT,
  slots_json TEXT NOT NULL,
  saved_at TEXT NOT NULL
);

CREATE INDEX parts_category ON parts (category);
CREATE INDEX parts_review_status ON parts (review_status);
