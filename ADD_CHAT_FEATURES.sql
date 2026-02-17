-- =========================================
-- NHAT MINH AI - ENHANCED CHAT FEATURES
-- Adds: Pin, Archive, Tags/Folders, Token Count, Latency
-- Run this in Supabase SQL Editor
-- =========================================

-- =========================================
-- 1. ADD NEW COLUMNS TO CONVERSATIONS
-- =========================================
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS folder_id UUID,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- =========================================
-- 2. ADD NEW COLUMNS TO MESSAGES
-- =========================================
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS token_count INTEGER,
ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS original_question TEXT;

-- =========================================
-- 3. CREATE FOLDERS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS chat_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- =========================================
-- 4. ADD FOREIGN KEY FOR FOLDER
-- =========================================
ALTER TABLE conversations
ADD CONSTRAINT fk_conversations_folder
FOREIGN KEY (folder_id) REFERENCES chat_folders(id) ON DELETE SET NULL;

-- =========================================
-- 5. CREATE INDEXES
-- =========================================
CREATE INDEX IF NOT EXISTS idx_conversations_pinned ON conversations(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(is_archived) WHERE is_archived = TRUE;
CREATE INDEX IF NOT EXISTS idx_conversations_folder ON conversations(folder_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tags ON conversations USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON chat_folders(user_id);

-- =========================================
-- 6. ENABLE ROW LEVEL SECURITY FOR FOLDERS
-- =========================================
ALTER TABLE chat_folders ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 7. CREATE POLICIES FOR FOLDERS
-- =========================================
DROP POLICY IF EXISTS "Users can view their own folders" ON chat_folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON chat_folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON chat_folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON chat_folders;

CREATE POLICY "Users can view their own folders"
  ON chat_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
  ON chat_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON chat_folders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON chat_folders FOR DELETE
  USING (auth.uid() = user_id);

-- =========================================
-- 8. ADD UPDATE/DELETE POLICIES FOR MESSAGES
-- =========================================
DROP POLICY IF EXISTS "Users can update their conversation messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their conversation messages" ON messages;

CREATE POLICY "Users can update their conversation messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their conversation messages"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- =========================================
-- 9. CREATE DEFAULT FOLDERS (OPTIONAL)
-- =========================================
-- Uncomment if you want to create default folders for existing users
-- INSERT INTO chat_folders (user_id, name, color)
-- SELECT DISTINCT user_id, 'Work', '#3b82f6' FROM conversations
-- ON CONFLICT DO NOTHING;

-- =========================================
-- SUCCESS!
-- =========================================
-- New columns added:
--   conversations: is_pinned, is_archived, folder_id, tags
--   messages: token_count, latency_ms, is_edited, original_question
-- New table created:
--   chat_folders (for organizing chats)
-- Features enabled:
--   - Pin important chats
--   - Archive old chats
--   - Organize chats in folders
--   - Tag chats with keywords
--   - Track token usage per message
--   - Track response latency
--   - Edit and re-send messages
-- =========================================
