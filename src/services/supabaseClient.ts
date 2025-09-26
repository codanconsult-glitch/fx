import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using local storage fallback.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface BrainData {
  id?: string;
  symbol: string;
  market_data: any;
  technical_indicators: any;
  sentiment_score: number;
  confidence_level: number;
  last_updated: string;
  insights: string[];
}

export interface TradingSignalDB {
  id?: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL' | 'HOLD';
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number;
  take_profit_3: number;
  confidence: number;
  risk_percentage: number;
  reasoning: string;
  trend: string;
  created_at: string;
  source: string;
}

export class SupabaseBrainService {
  static async saveBrainData(data: BrainData): Promise<void> {
    if (!supabase) {
      console.log('Supabase not configured, storing locally');
      localStorage.setItem(`brain_${data.symbol}`, JSON.stringify(data));
      return;
    }

    try {
      const { error } = await supabase
        .from('brain_data')
        .upsert(data, { onConflict: 'symbol' });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving brain data:', error);
      // Fallback to local storage
      localStorage.setItem(`brain_${data.symbol}`, JSON.stringify(data));
    }
  }

  static async getBrainData(symbol: string): Promise<BrainData | null> {
    if (!supabase) {
      const stored = localStorage.getItem(`brain_${symbol}`);
      return stored ? JSON.parse(stored) : null;
    }

    try {
      const { data, error } = await supabase
        .from('brain_data')
        .select('*')
        .eq('symbol', symbol)
        .limit(1);
      
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error fetching brain data:', error);
      const stored = localStorage.getItem(`brain_${symbol}`);
      return stored ? JSON.parse(stored) : null;
    }
  }

  static async saveSignal(signal: TradingSignalDB): Promise<void> {
    if (!supabase) {
      const signals = JSON.parse(localStorage.getItem('trading_signals') || '[]');
      signals.unshift(signal);
      localStorage.setItem('trading_signals', JSON.stringify(signals.slice(0, 100)));
      return;
    }

    try {
      const { error } = await supabase
        .from('trading_signals')
        .insert(signal);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving signal:', error);
      const signals = JSON.parse(localStorage.getItem('trading_signals') || '[]');
      signals.unshift(signal);
      localStorage.setItem('trading_signals', JSON.stringify(signals.slice(0, 100)));
    }
  }

  static async getRecentSignals(limit: number = 50): Promise<TradingSignalDB[]> {
    if (!supabase) {
      const signals = JSON.parse(localStorage.getItem('trading_signals') || '[]');
      return signals.slice(0, limit);
    }

    try {
      const { data, error } = await supabase
        .from('trading_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching signals:', error);
      const signals = JSON.parse(localStorage.getItem('trading_signals') || '[]');
      return signals.slice(0, limit);
    }
  }
}