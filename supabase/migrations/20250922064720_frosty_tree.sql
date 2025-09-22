/*
  # Create AI Trading Bot Brain Tables

  1. New Tables
    - `brain_data`
      - `id` (uuid, primary key)
      - `symbol` (text, unique)
      - `market_data` (jsonb)
      - `technical_indicators` (jsonb)
      - `sentiment_score` (numeric)
      - `confidence_level` (numeric)
      - `last_updated` (timestamptz)
      - `insights` (text array)
      - `created_at` (timestamptz)
    
    - `trading_signals`
      - `id` (uuid, primary key)
      - `symbol` (text)
      - `signal_type` (text)
      - `entry_price` (numeric)
      - `stop_loss` (numeric)
      - `take_profit_1` (numeric)
      - `take_profit_2` (numeric)
      - `take_profit_3` (numeric)
      - `confidence` (numeric)
      - `risk_percentage` (numeric)
      - `reasoning` (text)
      - `trend` (text)
      - `source` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (trading bot data)
*/

-- Create brain_data table
CREATE TABLE IF NOT EXISTS brain_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text UNIQUE NOT NULL,
  market_data jsonb DEFAULT '{}',
  technical_indicators jsonb DEFAULT '{}',
  sentiment_score numeric DEFAULT 0.5,
  confidence_level numeric DEFAULT 0.5,
  last_updated timestamptz DEFAULT now(),
  insights text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create trading_signals table
CREATE TABLE IF NOT EXISTS trading_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  signal_type text NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')),
  entry_price numeric NOT NULL,
  stop_loss numeric NOT NULL,
  take_profit_1 numeric NOT NULL,
  take_profit_2 numeric NOT NULL,
  take_profit_3 numeric NOT NULL,
  confidence numeric DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  risk_percentage numeric DEFAULT 2.0,
  reasoning text DEFAULT '',
  trend text DEFAULT 'SIDEWAYS' CHECK (trend IN ('BULLISH', 'BEARISH', 'SIDEWAYS')),
  source text DEFAULT 'AI Trading Bot',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE brain_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a trading bot)
CREATE POLICY "Allow public read access to brain_data"
  ON brain_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert/update access to brain_data"
  ON brain_data
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to trading_signals"
  ON trading_signals
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to trading_signals"
  ON trading_signals
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brain_data_symbol ON brain_data(symbol);
CREATE INDEX IF NOT EXISTS idx_brain_data_last_updated ON brain_data(last_updated);
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON trading_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON trading_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_signal_type ON trading_signals(signal_type);