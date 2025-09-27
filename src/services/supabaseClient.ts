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

export interface AILearningData {
  id?: string;
  symbol: string;
  signal_id: string;
  prediction: 'BUY' | 'SELL' | 'HOLD';
  actual_outcome: 'WIN' | 'LOSS' | 'PENDING';
  confidence: number;
  pnl_percentage: number;
  lessons_learned: string[];
  market_conditions: any;
  created_at: string;
  updated_at: string;
}

export interface MarketAnalysisData {
  id?: string;
  symbol: string;
  analysis_type: 'TRADINGVIEW' | 'NEWS' | 'DXY' | 'CHART';
  analysis_data: any;
  sentiment_score: number;
  confidence_level: number;
  created_at: string;
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

  static async saveLearningData(data: AILearningData): Promise<void> {
    if (!supabase) {
      const learningData = JSON.parse(localStorage.getItem('ai_learning_data') || '[]');
      learningData.unshift(data);
      localStorage.setItem('ai_learning_data', JSON.stringify(learningData.slice(0, 1000)));
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_learning_data')
        .upsert(data, { onConflict: 'signal_id' });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving learning data:', error);
      const learningData = JSON.parse(localStorage.getItem('ai_learning_data') || '[]');
      learningData.unshift(data);
      localStorage.setItem('ai_learning_data', JSON.stringify(learningData.slice(0, 1000)));
    }
  }

  static async getLearningData(limit: number = 100): Promise<AILearningData[]> {
    if (!supabase) {
      const learningData = JSON.parse(localStorage.getItem('ai_learning_data') || '[]');
      return learningData.slice(0, limit);
    }

    try {
      const { data, error } = await supabase
        .from('ai_learning_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching learning data:', error);
      const learningData = JSON.parse(localStorage.getItem('ai_learning_data') || '[]');
      return learningData.slice(0, limit);
    }
  }

  static async saveMarketAnalysis(data: MarketAnalysisData): Promise<void> {
    if (!supabase) {
      const analysisData = JSON.parse(localStorage.getItem('market_analysis_data') || '[]');
      analysisData.unshift(data);
      localStorage.setItem('market_analysis_data', JSON.stringify(analysisData.slice(0, 500)));
      return;
    }

    try {
      const { error } = await supabase
        .from('market_analysis_data')
        .insert(data);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving market analysis:', error);
      const analysisData = JSON.parse(localStorage.getItem('market_analysis_data') || '[]');
      analysisData.unshift(data);
      localStorage.setItem('market_analysis_data', JSON.stringify(analysisData.slice(0, 500)));
    }
  }

  static async getMarketAnalysis(symbol: string, analysisType?: string, limit: number = 50): Promise<MarketAnalysisData[]> {
    if (!supabase) {
      const analysisData = JSON.parse(localStorage.getItem('market_analysis_data') || '[]');
      return analysisData
        .filter((item: MarketAnalysisData) => 
          item.symbol === symbol && (!analysisType || item.analysis_type === analysisType)
        )
        .slice(0, limit);
    }

    try {
      let query = supabase
        .from('market_analysis_data')
        .select('*')
        .eq('symbol', symbol)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (analysisType) {
        query = query.eq('analysis_type', analysisType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching market analysis:', error);
      const analysisData = JSON.parse(localStorage.getItem('market_analysis_data') || '[]');
      return analysisData
        .filter((item: MarketAnalysisData) => 
          item.symbol === symbol && (!analysisType || item.analysis_type === analysisType)
        )
        .slice(0, limit);
    }
  }
}