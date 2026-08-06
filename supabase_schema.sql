-- Supabase Database Schema for TypingSprint

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT,
  avatar_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  theme TEXT DEFAULT 'retro',
  avatar_position JSONB DEFAULT '{"x": 50, "y": 50}'::jsonb,
  banner_position JSONB DEFAULT '{"x": 50, "y": 50}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER_STATS TABLE
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  best_wpm INT DEFAULT 0,
  avg_wpm INT DEFAULT 0,
  games_played INT DEFAULT 0,
  total_words INT DEFAULT 0,
  accuracy INT DEFAULT 0,
  matches_won INT DEFAULT 0,
  hours_played NUMERIC(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LOBBIES TABLE (For multiplayer room state persistence & discovery)
CREATE TABLE IF NOT EXISTS public.lobbies (
  room_id TEXT PRIMARY KEY,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL,
  game_mode TEXT DEFAULT 'random',
  max_players INT DEFAULT 4,
  is_protected BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  status TEXT DEFAULT 'waiting', -- waiting, starting, in_progress, finished
  target_text TEXT DEFAULT '',
  time_limit INT DEFAULT 60,
  current_round INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR PROFILES
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- POLICIES FOR USER_STATS
CREATE POLICY "User stats are viewable by everyone." 
  ON public.user_stats FOR SELECT USING (true);

CREATE POLICY "Users can update their own stats." 
  ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats." 
  ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POLICIES FOR LOBBIES
CREATE POLICY "Lobbies are viewable by authenticated users." 
  ON public.lobbies FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create lobbies." 
  ON public.lobbies FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Lobby hosts can update their lobbies." 
  ON public.lobbies FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Lobby hosts can delete their lobbies." 
  ON public.lobbies FOR DELETE USING (auth.uid() = host_id);

-- AUTOMATIC TRIGGER FOR NEW USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    UPPER(SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)) FROM 1 FOR 1))
  );

  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP IF EXISTS & RECREATE TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
