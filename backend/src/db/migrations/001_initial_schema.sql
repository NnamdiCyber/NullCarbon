-- NullCarbon initial database schema
-- Run with: psql $DATABASE_URL -f 001_initial_schema.sql

CREATE TABLE IF NOT EXISTS credits (
  id SERIAL PRIMARY KEY,
  credit_id VARCHAR(64) UNIQUE NOT NULL,
  registry VARCHAR(32) NOT NULL,
  registry_id INTEGER NOT NULL,
  credit_hash VARCHAR(66) NOT NULL,
  vintage_year INTEGER NOT NULL,
  methodology_code INTEGER NOT NULL,
  methodology_name VARCHAR(64),
  permanence_rating INTEGER NOT NULL,
  tonne_volume BIGINT NOT NULL,
  is_retired BOOLEAN DEFAULT false,
  stellar_token_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS merkle_snapshots (
  id SERIAL PRIMARY KEY,
  registry VARCHAR(32) NOT NULL,
  merkle_root VARCHAR(66) NOT NULL,
  depth INTEGER DEFAULT 20,
  credit_count INTEGER NOT NULL,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nullifiers (
  id SERIAL PRIMARY KEY,
  nullifier VARCHAR(66) UNIQUE NOT NULL,
  corridor_id VARCHAR(66),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  stellar_tx_hash VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS retirement_certificates (
  id SERIAL PRIMARY KEY,
  certificate_id VARCHAR(64) UNIQUE NOT NULL,
  nullifier VARCHAR(66) NOT NULL,
  registry_root VARCHAR(66),
  volume_commitment VARCHAR(66),
  corridor_id VARCHAR(66),
  stellar_tx_hash VARCHAR(64),
  ledger INTEGER,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);
