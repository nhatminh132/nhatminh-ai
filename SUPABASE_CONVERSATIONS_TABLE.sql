-- =========================================
-- NHAT MINH AI - CONVERSATIONS & MESSAGES SCHEMA
-- This creates proper conversation tracking
-- Run this in Supabase SQL Editor
-- =========================================

-- =========================================
-- 1. CREATE CONVERSATIONS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- =========================================
-- 2. CREATE MESSAGES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  model_used TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- =========================================
-- 3. CREATE INDEXES
-- =========================================
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- =========================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =========================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 5. CREATE POLICIES FOR CONVERSATIONS
-- =========================================
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- =========================================
-- 6. CREATE POLICIES FOR MESSAGES
-- =========================================
DROP POLICY IF EXISTS "Users can view their conversation messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their conversation messages" ON messages;

CREATE POLICY "Users can view their conversation messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their conversation messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- =========================================
-- 7. MIGRATE EXISTING DATA (if chat_history exists)
-- =========================================
DO $$
DECLARE
  table_exists boolean;
BEGIN
  -- Check if chat_history table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'chat_history'
  ) INTO table_exists;

  -- If it exists, migrate the data
  IF table_exists THEN
    -- Create conversations from unique chat_history entries
    INSERT INTO conversations (id, user_id, title, created_at, updated_at)
    SELECT 
      id,
      user_id,
      COALESCE(title, LEFT(question, 60)) as title,
      created_at,
      created_at as updated_at
    FROM chat_history
    ON CONFLICT (id) DO NOTHING;

    -- Create messages from chat_history
    INSERT INTO messages (conversation_id, question, answer, model_used, created_at)
    SELECT 
      id as conversation_id,
      question,
      answer,
      model_used,
      created_at
    FROM chat_history
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Data migrated from chat_history successfully!';
  ELSE
    RAISE NOTICE 'No chat_history table found - skipping migration';
  END IF;
END $$;

-- =========================================
-- 8. CREATE FUNCTION TO UPDATE TIMESTAMP
-- =========================================
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = TIMEZONE('utc', NOW())
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 9. CREATE TRIGGER
-- =========================================
DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- =========================================
-- 10. ENABLE REALTIME
-- =========================================
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =========================================
-- SUCCESS!
-- =========================================
-- Tables created:
--   - conversations (chat sessions)
--   - messages (individual Q&A pairs)
-- Features enabled:
--   - Row Level Security
--   - Real-time subscriptions
--   - Auto-update conversation timestamp
--   - Cascade deletes
-- =========================================
