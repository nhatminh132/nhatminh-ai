-- =========================================
-- NUCLEAR OPTION: Complete Clean Slate
-- This will DELETE EVERYTHING and start fresh
-- WARNING: This deletes ALL your chat data!
-- =========================================

-- Drop everything in order
DROP TRIGGER IF EXISTS update_conversation_on_message ON messages CASCADE;
DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS chat_history CASCADE;

-- Now create fresh tables
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  model_used TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversation policies
CREATE POLICY conversations_select ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY conversations_insert ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY conversations_update ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY conversations_delete ON conversations FOR DELETE USING (auth.uid() = user_id);

-- Message policies
CREATE POLICY messages_select ON messages FOR SELECT 
USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));

CREATE POLICY messages_insert ON messages FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));

-- Create trigger function
CREATE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

SELECT 'Complete reset successful!' as status;
