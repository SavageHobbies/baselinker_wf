-- Add baselinker_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'baselinker_id'
    ) THEN
        ALTER TABLE products ADD COLUMN baselinker_id bigint;
    END IF;
END $$;
