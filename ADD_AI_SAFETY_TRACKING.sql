-- Add seen_ai_safety column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS seen_ai_safety BOOLEAN DEFAULT FALSE;

-- Update the trigger function to include seen_ai_safety
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, uploads_left, seen_ai_safety)
  VALUES (new.id, 5, FALSE);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
