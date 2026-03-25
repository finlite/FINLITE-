BEGIN;

-- PostgreSQL schema converted from finlite.sql (MySQL/MariaDB)

-- Drop in dependency-safe order
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS business_info CASCADE;
DROP TABLE IF EXISTS support CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS transaction_category;

-- Enum conversion
CREATE TYPE transaction_category AS ENUM ('sale', 'expense');

-- users
CREATE TABLE users (
  user_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name text NOT NULL,
  email varchar(255) NOT NULL,
  phone integer NOT NULL,
  password varchar(255) NOT NULL,
  photo bytea NOT NULL,
  is_premium_member boolean NOT NULL DEFAULT false,
  premium_start_date date DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- support
CREATE TABLE support (
  support_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL,
  full_name varchar(100) NOT NULL,
  email varchar(255) NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  CONSTRAINT support_user_id_unique UNIQUE (user_id)
);

-- business_info
CREATE TABLE business_info (
  business_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL,
  business_name varchar(255) DEFAULT NULL,
  address varchar(255) NOT NULL,
  business_type varchar(255) DEFAULT NULL,
  business_phone varchar(11) DEFAULT NULL,
  business_email varchar(255) DEFAULT NULL,
  registration_date date DEFAULT NULL,
  open_hours jsonb NOT NULL,
  online_prescence jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT business_info_user_id_unique UNIQUE (user_id),
  CONSTRAINT fk_business_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- transactions
CREATE TABLE transactions (
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
  CONSTRAINT transactions_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE user_settings (
  settings_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL,
  preferred_language varchar(10) NOT NULL DEFAULT 'en',
  date_format varchar(32) NOT NULL DEFAULT 'DD/MM/YYYY',
  currency_display varchar(64) NOT NULL DEFAULT '₦ (Nigerian Naira)',
  number_format varchar(32) NOT NULL DEFAULT '1,234.56',
  auto_translate boolean NOT NULL DEFAULT true,
  show_original_text boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_settings_user_id_unique UNIQUE (user_id),
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE INDEX transactions_user_id_idx ON transactions (user_id);

-- Trigger to emulate MySQL "ON UPDATE CURRENT_TIMESTAMP"
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER transactions_set_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER user_settings_set_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
