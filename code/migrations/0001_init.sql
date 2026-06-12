CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'free',
  subscription_plan TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_sub_status ON users(subscription_status);

CREATE TABLE workouts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  mux_playback_id TEXT,
  mux_asset_id TEXT,
  mux_status TEXT DEFAULT 'pending',
  duration_seconds INTEGER,
  level TEXT DEFAULT 'Beginner',
  category TEXT,
  is_free BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_workouts_published ON workouts(is_published);
CREATE INDEX idx_workouts_free ON workouts(is_free);
CREATE INDEX idx_workouts_featured ON workouts(is_featured);
CREATE INDEX idx_workouts_category ON workouts(category);
CREATE INDEX idx_workouts_sort ON workouts(sort_order);

CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, workout_id)
);
CREATE INDEX idx_favorites_user ON favorites(user_id);

CREATE TABLE workout_completions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  duration_watched_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_completions_user ON workout_completions(user_id);
CREATE INDEX idx_completions_date ON workout_completions(completed_at);

CREATE TABLE story_content (
  id SERIAL PRIMARY KEY,
  content_key TEXT UNIQUE NOT NULL,
  content_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  plan_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  interval TEXT NOT NULL,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO subscription_plans (plan_key, display_name, amount_cents, interval) VALUES
  ('monthly', 'Monthly', 499, 'month'),
  ('annual',  'Annual',  3599, 'year');
-- After creating the Stripe Product + Prices, update stripe_price_id on each row.
