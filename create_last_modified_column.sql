-- Add last_modified column if it doesn't exist
-- Add timestamp columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS last_modified timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP;

-- Create or replace the timestamp update function
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS trigger AS $$ 
BEGIN
    NEW.last_modified = CURRENT_TIMESTAMP;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_products_last_modified ON products;

-- Create trigger
CREATE TRIGGER update_products_last_modified
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();
