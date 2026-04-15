const db = require('./database');

let schemaReadyPromise;

async function ensureAppSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await db.query(`
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$;
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS support (
          support_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          user_id integer NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          full_name varchar(100) NOT NULL,
          email varchar(255) NOT NULL,
          subject text NOT NULL,
          message text NOT NULL
        );
      `);

      await db.query(`
        ALTER TABLE support
        DROP CONSTRAINT IF EXISTS support_user_id_unique;
      `);

      await db.query(`
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
      `);

      await db.query(`
        ALTER TABLE users
        ALTER COLUMN phone TYPE varchar(20)
        USING phone::text;
      `);

      await db.query(`
        ALTER TABLE business_info
        ADD COLUMN IF NOT EXISTS business_name varchar(255),
        ADD COLUMN IF NOT EXISTS registration_date date;
      `);

      await db.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_trigger
            WHERE tgname = 'users_set_updated_at'
          ) THEN
            CREATE TRIGGER users_set_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
          END IF;
        END
        $$;
      `);

      await db.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_trigger
            WHERE tgname = 'user_settings_set_updated_at'
          ) THEN
            CREATE TRIGGER user_settings_set_updated_at
            BEFORE UPDATE ON user_settings
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
          END IF;
        END
        $$;
      `);
    })().catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }

  return schemaReadyPromise;
}

module.exports = ensureAppSchema;
