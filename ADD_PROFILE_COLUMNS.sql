-- Add display_name and username columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT;

-- Add seen_ai_safety column if not already added
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS seen_ai_safety BOOLEAN DEFAULT FALSE;

-- Update the trigger function to include all new columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, uploads_left, seen_ai_safety)
  VALUES (new.id, 5, FALSE)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set default values for existing users
UPDATE profiles 
SET seen_ai_safety = FALSE 
WHERE seen_ai_safety IS NULL;
