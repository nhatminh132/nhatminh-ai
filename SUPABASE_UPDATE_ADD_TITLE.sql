-- Add title column to chat_history table for chat renaming feature
-- Run this if you already ran SUPABASE_SCHEMA_SAFE.sql

-- Add title column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'chat_history' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE chat_history ADD COLUMN title TEXT;
    
    -- Update existing rows to have title based on question
    UPDATE chat_history 
    SET title = SUBSTRING(question, 1, 50)
    WHERE title IS NULL;
    
    RAISE NOTICE 'Added title column to chat_history table';
  ELSE
    RAISE NOTICE 'Title column already exists';
  END IF;
END $$;

-- Add policy for updating chat titles
DROP POLICY IF EXISTS "Users can update their own chat history" ON chat_history;

CREATE POLICY "Users can update their own chat history"
  ON chat_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add policy for deleting chat history
DROP POLICY IF EXISTS "Users can delete their own chat history" ON chat_history;

CREATE POLICY "Users can delete their own chat history"
  ON chat_history FOR DELETE
  USING (auth.uid() = user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Chat rename feature enabled!';
  RAISE NOTICE 'Users can now rename and delete their chat history';
END $$;
