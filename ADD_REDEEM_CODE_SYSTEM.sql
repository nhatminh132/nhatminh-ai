-- Create redeemed_codes table
CREATE TABLE IF NOT EXISTS public.redeemed_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_redeemed_codes_user_id ON public.redeemed_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_redeemed_codes_code ON public.redeemed_codes(code);
CREATE INDEX IF NOT EXISTS idx_redeemed_codes_expires_at ON public.redeemed_codes(expires_at);

-- Enable RLS
ALTER TABLE public.redeemed_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own redeemed codes"
  ON public.redeemed_codes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own redeemed codes"
  ON public.redeemed_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.redeemed_codes IS 'Stores user redeemed codes and their expiration dates';
