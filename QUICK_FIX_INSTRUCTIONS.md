# Quick Fix: Enable Chat Rename Feature

## The Issue
The rename functionality needs a `title` column in the `chat_history` table.

## Solution - Run This SQL:

1. **Go to Supabase Dashboard**: https://pimnoojbtmrxuhxckinc.supabase.co
2. **Click "SQL Editor"** in the left sidebar
3. **Click "+ New Query"**
4. **Copy and paste the content from**: `SUPABASE_UPDATE_ADD_TITLE.sql`
5. **Click "Run"** (or press Ctrl+Enter)

## What It Does:
✅ Adds `title` column to `chat_history` table
✅ Fills existing chats with titles (first 50 chars of question)
✅ Adds UPDATE policy (for renaming)
✅ Adds DELETE policy (for deleting chats)

## After Running:
- Rename feature will work ✅
- Delete feature will work ✅
- Existing chats will have auto-generated titles ✅

## Alternative: Fresh Start
If you haven't run any SQL yet, use the updated schema below instead.
