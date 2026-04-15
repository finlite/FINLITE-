BEGIN;

-- =========================
-- ENUM
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'transaction_category'
  ) THEN
    CREATE TYPE transaction_category AS ENUM ('sale', 'expense');
  END IF;
END$$;

-- =========================
-- FUNCTION
-- =========================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- =========================
-- USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
  user_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name text NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(20) NOT NULL,
  password varchar(255) NOT NULL,
  photo bytea NOT NULL,
  is_premium_member boolean NOT NULL DEFAULT false,
  premium_start_date date DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ALTER COLUMN phone TYPE varchar(20)
USING phone::text;

-- =========================
-- SUPPORT
-- =========================
CREATE TABLE IF NOT EXISTS support (
  support_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  full_name varchar(100) NOT NULL,
  email varchar(255) NOT NULL,
  subject text NOT NULL,
  message text NOT NULL
);

ALTER TABLE support
DROP CONSTRAINT IF EXISTS support_user_id_unique;

-- =========================
-- BUSINESS INFO
-- =========================
CREATE TABLE IF NOT EXISTS business_info (
  business_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL,
  business_name varchar(255) DEFAULT NULL,
  address varchar(255) NOT NULL,
  business_type varchar(255) DEFAULT NULL,
  business_phone varchar(20) DEFAULT NULL,
  business_email varchar(255) DEFAULT NULL,
  registration_date date DEFAULT NULL,
  open_hours jsonb NOT NULL,
  online_prescence jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT business_info_user_id_unique UNIQUE (user_id),
  CONSTRAINT fk_business_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

ALTER TABLE business_info
ADD COLUMN IF NOT EXISTS business_name varchar(255),
ADD COLUMN IF NOT EXISTS registration_date date;

-- =========================
-- TRANSACTIONS
-- =========================
CREATE TABLE IF NOT EXISTS transactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transaction_id varchar(100) NOT NULL,
  user_id integer NOT NULL,
  category transaction_category NOT NULL,
  amount numeric(12,2) NOT NULL,
  service varchar(255) DEFAULT NULL,
  notes text DEFAULT NULL,
  transaction_date timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT transactions_transaction_id_unique UNIQUE (transaction_id),
  CONSTRAINT transactions_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions (user_id);

-- =========================
-- USER SETTINGS
-- =========================
CREATE TABLE IF NOT EXISTS user_settings (
  settings_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  preferred_language varchar(10) NOT NULL DEFAULT 'en',
  date_format varchar(32) NOT NULL DEFAULT 'DD/MM/YYYY',
  currency_display varchar(64) NOT NULL DEFAULT '₦ (Nigerian Naira)',
  number_format varchar(32) NOT NULL DEFAULT '1,234.56',
  auto_translate boolean NOT NULL DEFAULT true,
  show_original_text boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TRIGGERS
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'users_set_updated_at'
  ) THEN
    CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'transactions_set_updated_at'
  ) THEN
    CREATE TRIGGER transactions_set_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'user_settings_set_updated_at'
  ) THEN
    CREATE TRIGGER user_settings_set_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

COMMIT;