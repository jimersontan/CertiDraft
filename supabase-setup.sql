-- CertiDraft Database Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Ensure users table has correct columns (for Supabase Auth integration)
-- Note: Some columns might already exist depending on your previous setup
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='plan') THEN
        ALTER TABLE public.users ADD COLUMN plan TEXT DEFAULT 'free';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='plan_expires_at') THEN
        ALTER TABLE public.users ADD COLUMN plan_expires_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='certificates_this_month') THEN
        ALTER TABLE public.users ADD COLUMN certificates_this_month INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_usage_reset') THEN
        ALTER TABLE public.users ADD COLUMN last_usage_reset TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 2. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    description TEXT,
    template_id UUID,
    elements JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
    certificate_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Templates Table
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    industry TEXT,
    description TEXT,
    thumbnail_url TEXT,
    accent_color TEXT,
    secondary_color TEXT,
    style TEXT,
    uses INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    elements JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Sessions table (if you want to use custom JWT refresh tokens)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Seed Fallback Templates
INSERT INTO public.templates (id, name, category, industry, description, is_featured)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Executive Excellence', 'Corporate', 'Business', 'Clean, modern professional certificate.', true),
('00000000-0000-0000-0000-000000000002', 'Prestige Boardroom', 'Corporate', 'Finance', 'Elegant gold-themed design.', false),
('00000000-0000-0000-0000-000000000003', 'Scholars Crest', 'Academic', 'Education', 'Traditional academic certificate.', false),
('00000000-0000-0000-0000-000000000004', 'Campus Modern', 'Academic', 'E-Learning', 'Dynamic modern education layout.', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Enable Row Level Security (Optional but recommended)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;
CREATE POLICY "Users can manage their own projects" ON public.projects
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Templates are viewable by everyone" ON public.templates;
CREATE POLICY "Templates are viewable by everyone" ON public.templates
    FOR SELECT USING (true);

-- 7. Helper Functions
CREATE OR REPLACE FUNCTION increment_usage(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.users
  SET certificates_this_month = COALESCE(certificates_this_month, 0) + 1
  WHERE id = user_id
  RETURNING certificates_this_month INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_usage_by(user_id UUID, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.users
  SET certificates_this_month = COALESCE(certificates_this_month, 0) + amount
  WHERE id = user_id
  RETURNING certificates_this_month INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
