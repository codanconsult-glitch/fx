/*
  # TradingView Authors Monitoring Schema

  1. New Tables
    - `tradingview_authors`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `display_name` (text)
      - `profile_url` (text)
      - `avatar_url` (text, nullable)
      - `followers` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `tradingview_posts`
      - `id` (uuid, primary key)
      - `author_id` (uuid, foreign key to tradingview_authors)
      - `post_id` (text, unique) - TradingView's post ID
      - `title` (text)
      - `content` (text)
      - `symbol` (text, nullable) - e.g., XAUUSD, EURUSD
      - `image_url` (text, nullable)
      - `chart_url` (text, nullable)
      - `published_at` (timestamptz)
      - `likes` (integer, default 0)
      - `comments` (integer, default 0)
      - `signal_type` (text, nullable) - BUY/SELL/NEUTRAL
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access (authors and posts are public data)
    - Add policies for authenticated write access (for the system to update)

  3. Indexes
    - Index on author username for fast lookups
    - Index on post published_at for sorting
    - Index on author_id in posts table for efficient joins
*/

-- Create tradingview_authors table
CREATE TABLE IF NOT EXISTS tradingview_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  display_name text,
  profile_url text NOT NULL,
  avatar_url text,
  followers integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tradingview_posts table
CREATE TABLE IF NOT EXISTS tradingview_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES tradingview_authors(id) ON DELETE CASCADE,
  post_id text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  symbol text,
  image_url text,
  chart_url text,
  published_at timestamptz NOT NULL,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  signal_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_authors_username ON tradingview_authors(username);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON tradingview_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON tradingview_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_symbol ON tradingview_posts(symbol);

-- Enable Row Level Security
ALTER TABLE tradingview_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradingview_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Authors are publicly readable"
  ON tradingview_authors FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Posts are publicly readable"
  ON tradingview_posts FOR SELECT
  TO public
  USING (true);

-- Create policies for authenticated write access
CREATE POLICY "Authenticated users can insert authors"
  ON tradingview_authors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update authors"
  ON tradingview_authors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert posts"
  ON tradingview_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update posts"
  ON tradingview_posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
