-- =========================================
-- DIAGNOSTIC QUERY
-- Find all triggers and functions that might be causing the error
-- =========================================

-- 1. Check all existing triggers
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- 2. Check all functions
SELECT 
  routine_name as function_name,
  routine_definition as definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 3. Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 4. Check columns in messages table (if it exists)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'messages'
ORDER BY ordinal_position;
