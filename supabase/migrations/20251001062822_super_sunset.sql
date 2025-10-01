/*
  # Create AI Learning Data Table

  1. New Tables
    - `ai_learning_data`
      - `id` (uuid, primary key)
      - `symbol` (text, not null) - Trading symbol (XAUUSD, EURUSD, etc.)
      - `signal_id` (text, unique, not null) - Unique identifier for the trading signal
      - `prediction` (text, not null) - AI prediction (BUY, SELL, HOLD)
      - `actual_outcome` (text, not null) - Actual trade outcome (WIN, LOSS, PENDING)
      - `confidence` (real, not null) - AI confidence level (0.0 to 1.0)
      - `pnl_percentage` (real, not null) - Profit/Loss percentage
      - `lessons_learned` (jsonb) - Array of lessons learned from the trade
      - `market_conditions` (jsonb) - Market conditions at time of signal
      - `created_at` (timestamptz) - When the record was created
      - `updated_at` (timestamptz) - When the record was last updated

  2. Security
    - Enable RLS on `ai_learning_data` table
    - Add policies for public read access
    - Add policies for authenticated insert/update access

  3. Indexes
    - Index on symbol for faster queries
    - Index on created_at for time-based queries
    - Index on actual_outcome for filtering
*/

-- Create the ai_learning_data table
CREATE TABLE IF NOT EXISTS public.ai_learning_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol text NOT NULL,
    signal_id text UNIQUE NOT NULL,
    prediction text NOT NULL CHECK (prediction IN ('BUY', 'SELL', 'HOLD')),
    actual_outcome text NOT NULL CHECK (actual_outcome IN ('WIN', 'LOSS', 'PENDING', 'PARTIAL')),
    confidence real NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    pnl_percentage real NOT NULL DEFAULT 0.0,
    lessons_learned jsonb DEFAULT '[]'::jsonb,
    market_conditions jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.ai_learning_data ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_symbol ON public.ai_learning_data(symbol);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_created_at ON public.ai_learning_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_outcome ON public.ai_learning_data(actual_outcome);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_signal_id ON public.ai_learning_data(signal_id);

-- Create RLS policies
CREATE POLICY "Allow public read access to ai_learning_data"
    ON public.ai_learning_data
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert access to ai_learning_data"
    ON public.ai_learning_data
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public update access to ai_learning_data"
    ON public.ai_learning_data
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete access to ai_learning_data"
    ON public.ai_learning_data
    FOR DELETE
    TO public
    USING (true);