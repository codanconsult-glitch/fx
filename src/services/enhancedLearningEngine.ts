import { TradingSignal } from '../types/trading';
import { SupabaseBrainService, AILearningData } from './supabaseClient';
import { MarketPriceService } from './marketPriceService';

interface TradeOutcome {
  signalId: string;
  symbol: string;
  signalType: 'BUY' | 'SELL' | 'HOLD';
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  confidence: number;
  timestamp: Date;
  outcome: 'WIN' | 'LOSS' | 'PARTIAL' | 'PENDING';
  tpLevelsHit: {
    tp1: boolean;
    tp2: boolean;
    tp3: boolean;
  };
  stopLossHit: boolean;
  pnl: number;
  pnlPercentage: number;
  reasoningFactors: string[];
  marketConditions: any;
  lessonsLearned: string[];
  winRate: number;
}

interface LearningMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgPnL: number;
  avgConfidence: number;
  bestPerformingFactors: string[];
  worstPerformingFactors: string[];
  symbolPerformance: Map<string, { wins: number; losses: number; avgPnL: number; winRate: number }>;
  confidenceAccuracy: Map<string, number>;
  improvementSuggestions: string[];
}

interface LearningRule {
  id: string;
  condition: string;
  action: 'INCREASE_CONFIDENCE' | 'DECREASE_CONFIDENCE' | 'AVOID_SIGNAL' | 'PREFER_SIGNAL';
  confidence: number;
  successRate: number;
  timesApplied: number;
  createdAt: Date;
  lastUpdated: Date;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class EnhancedLearningEngine {
  private static instance: EnhancedLearningEngine;
  private tradeHistory: TradeOutcome[] = [];
  private learningRules: LearningRule[] = [];
  private metrics: LearningMetrics;
  private isLearning = true;

  constructor() {
    this.metrics = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      avgPnL: 0,
      avgConfidence: 0,
      bestPerformingFactors: [],
      worstPerformingFactors: [],
      symbolPerformance: new Map(),
      confidenceAccuracy: new Map(),
      improvementSuggestions: []
    };
    this.loadLearningData();
    this.startContinuousLearning();
  }

  static getInstance(): EnhancedLearningEngine {
    if (!EnhancedLearningEngine.instance) {
      EnhancedLearningEngine.instance = new EnhancedLearningEngine();
    }
    return EnhancedLearningEngine.instance;
  }

  private async loadLearningData(): Promise<void> {
    try {
      // Load from Supabase instead of localStorage
      const learningData = await SupabaseBrainService.getLearningData(1000);
      
      this.tradeHistory = learningData.map(data => ({
        signalId: data.signal_id,
        symbol: data.symbol,
        signalType: data.prediction,
        entryPrice: 0, // Will be populated from signal data
        currentPrice: 0,
        stopLoss: 0,
        takeProfit1: 0,
        takeProfit2: 0,
        takeProfit3: 0,
        confidence: data.confidence,
        timestamp: new Date(data.created_at),
        outcome: data.actual_outcome,
        tpLevelsHit: { tp1: false, tp2: false, tp3: false },
        stopLossHit: false,
        pnl: data.pnl_percentage,
        pnlPercentage: data.pnl_percentage,
        reasoningFactors: [],
        marketConditions: data.market_conditions || {},
        lessonsLearned: data.lessons_learned || [],
        winRate: 0
      }));

      this.updateMetrics();
      console.log(`📚 Enhanced Learning Engine loaded: ${this.tradeHistory.length} trades from Supabase`);
    } catch (error) {
      console.error('Error loading learning data from Supabase:', error);
    }
  }

  private startContinuousLearning(): void {
    // Check for trade outcomes every 30 seconds
    setInterval(() => {
      this.checkTradeOutcomes();
    }, 30000);

    // Update learning rules every 5 minutes
    setInterval(() => {
      this.updateLearningRules();
    }, 5 * 60 * 1000);

    console.log('🧠 Continuous learning started - checking trades every 30 seconds');
  }

  async recordTrade(
    signalId: string,
    symbol: string,
    signalType: 'BUY' | 'SELL' | 'HOLD',
    entryPrice: number,
    stopLoss: number,
    takeProfit1: number,
    takeProfit2: number,
    takeProfit3: number,
    confidence: number,
    reasoningFactors: string[],
    marketConditions: any
  ): Promise<void> {
    const trade: TradeOutcome = {
      signalId,
      symbol,
      signalType,
      entryPrice,
      currentPrice: entryPrice,
      stopLoss,
      takeProfit1,
      takeProfit2,
      takeProfit3,
      confidence,
      timestamp: new Date(),
      outcome: 'PENDING',
      tpLevelsHit: { tp1: false, tp2: false, tp3: false },
      stopLossHit: false,
      pnl: 0,
      pnlPercentage: 0,
      reasoningFactors,
      marketConditions,
      lessonsLearned: [],
      winRate: 0
    };

    this.tradeHistory.push(trade);
    
    // Save to Supabase
    await this.saveLearningData(trade);
    
    console.log(`📝 Trade recorded: ${signalType} ${symbol} @ ${entryPrice} (ID: ${signalId})`);
  }

  private async saveLearningData(trade: TradeOutcome): Promise<void> {
    try {
      const learningData: AILearningData = {
        symbol: trade.symbol,
        signal_id: trade.signalId,
        prediction: trade.signalType,
        actual_outcome: trade.outcome,
        confidence: trade.confidence,
        pnl_percentage: trade.pnlPercentage,
        lessons_learned: trade.lessonsLearned,
        market_conditions: trade.marketConditions,
        created_at: trade.timestamp.toISOString(),
        updated_at: new Date().toISOString()
      };

      await SupabaseBrainService.saveLearningData(learningData);
    } catch (error) {
      console.error('Error saving learning data to Supabase:', error);
    }
  }

  private async checkTradeOutcomes(): Promise<void> {
    const pendingTrades = this.tradeHistory.filter(t => t.outcome === 'PENDING');
    
    for (const trade of pendingTrades) {
      const tpslStatus = MarketPriceService.checkTPSLLevels(trade);
      
      if (tpslStatus.stopLossHit) {
        await this.updateTradeOutcome(trade.signalId, 'LOSS', tpslStatus.currentPrice);
      } else if (tpslStatus.tp1Hit || tpslStatus.tp2Hit || tpslStatus.tp3Hit) {
        const outcome = this.determineWinOutcome(tpslStatus);
        await this.updateTradeOutcome(trade.signalId, outcome, tpslStatus.currentPrice);
      }
    }
  }

  private determineWinOutcome(tpslStatus: any): 'WIN' | 'PARTIAL' {
    if (tpslStatus.tp3Hit) return 'WIN';
    if (tpslStatus.tp2Hit) return 'WIN';
    if (tpslStatus.tp1Hit) return 'PARTIAL';
    return 'WIN';
  }

  async updateTradeOutcome(signalId: string, outcome: 'WIN' | 'LOSS' | 'PARTIAL', currentPrice: number): Promise<void> {
    const trade = this.tradeHistory.find(t => t.signalId === signalId);
    if (!trade) {
      console.warn(`Trade ${signalId} not found for outcome update`);
      return;
    }

    trade.outcome = outcome;
    trade.currentPrice = currentPrice;
    
    // Calculate P&L
    if (trade.signalType === 'BUY') {
      trade.pnl = currentPrice - trade.entryPrice;
    } else if (trade.signalType === 'SELL') {
      trade.pnl = trade.entryPrice - currentPrice;
    }
    
    trade.pnlPercentage = (trade.pnl / trade.entryPrice) * 100;

    // Generate lessons learned
    trade.lessonsLearned = this.generateLessons(trade);

    // Update metrics
    this.updateMetrics();

    // Save updated data to Supabase
    await this.saveLearningData(trade);
    
    console.log(`📊 Trade outcome updated: ${outcome} for ${trade.symbol} (P&L: ${trade.pnlPercentage.toFixed(2)}%)`);
    
    // Generate improvement suggestions
    this.generateImprovementSuggestions();
  }

  private generateLessons(trade: TradeOutcome): string[] {
    const lessons: string[] = [];

    if (trade.outcome === 'WIN' || trade.outcome === 'PARTIAL') {
      lessons.push(`${trade.symbol} ${trade.signalType} signals work well with ${(trade.confidence * 100).toFixed(1)}% confidence`);
      
      if (trade.marketConditions.volatility > 0.03) {
        lessons.push('High volatility conditions favor this setup');
      }
      
      if (trade.marketConditions.tradingViewSentiment === trade.signalType) {
        lessons.push('TradingView sentiment alignment increases success rate');
      }

      if (trade.marketConditions.dxyImpact === 'POSITIVE') {
        lessons.push('Positive DXY correlation supported the trade direction');
      }
    } else if (trade.outcome === 'LOSS') {
      lessons.push(`${trade.symbol} ${trade.signalType} signals need refinement at ${(trade.confidence * 100).toFixed(1)}% confidence`);
      
      if (trade.marketConditions.newsImpact === 'HIGH') {
        lessons.push('Avoid trading during high impact news events');
      }
      
      if (trade.marketConditions.riskLevel === 'HIGH') {
        lessons.push('High risk market conditions require stronger conviction');
      }

      if (trade.confidence < 0.7) {
        lessons.push('Low confidence signals should be avoided or risk reduced');
      }
    }

    return lessons;
  }

  private updateMetrics(): void {
    const completedTrades = this.tradeHistory.filter(t => t.outcome !== 'PENDING');
    
    this.metrics.totalTrades = completedTrades.length;
    this.metrics.winningTrades = completedTrades.filter(t => t.outcome === 'WIN' || t.outcome === 'PARTIAL').length;
    this.metrics.losingTrades = completedTrades.filter(t => t.outcome === 'LOSS').length;
    
    if (completedTrades.length > 0) {
      this.metrics.winRate = this.metrics.winningTrades / completedTrades.length;
      
      const totalPnL = completedTrades.reduce((sum, t) => sum + t.pnlPercentage, 0);
      this.metrics.avgPnL = totalPnL / completedTrades.length;
      
      const totalConfidence = completedTrades.reduce((sum, t) => sum + t.confidence, 0);
      this.metrics.avgConfidence = totalConfidence / completedTrades.length;
    }

    // Update symbol performance
    this.updateSymbolPerformance(completedTrades);
    
    // Update factor performance
    this.updateFactorPerformance(completedTrades);
  }

  private updateSymbolPerformance(completedTrades: TradeOutcome[]): void {
    this.metrics.symbolPerformance.clear();
    
    const symbolStats = new Map<string, { wins: number; losses: number; totalPnL: number; count: number }>();
    
    completedTrades.forEach(trade => {
      const existing = symbolStats.get(trade.symbol) || { wins: 0, losses: 0, totalPnL: 0, count: 0 };
      
      if (trade.outcome === 'WIN' || trade.outcome === 'PARTIAL') {
        existing.wins++;
      } else {
        existing.losses++;
      }
      
      existing.totalPnL += trade.pnlPercentage;
      existing.count++;
      
      symbolStats.set(trade.symbol, existing);
    });

    symbolStats.forEach((stats, symbol) => {
      this.metrics.symbolPerformance.set(symbol, {
        wins: stats.wins,
        losses: stats.losses,
        avgPnL: stats.totalPnL / stats.count,
        winRate: stats.wins / stats.count
      });
    });
  }

  private updateFactorPerformance(completedTrades: TradeOutcome[]): void {
    const factorPerformance = new Map<string, { wins: number; total: number }>();
    
    completedTrades.forEach(trade => {
      trade.reasoningFactors.forEach(factor => {
        const existing = factorPerformance.get(factor) || { wins: 0, total: 0 };
        existing.total++;
        if (trade.outcome === 'WIN' || trade.outcome === 'PARTIAL') {
          existing.wins++;
        }
        factorPerformance.set(factor, existing);
      });
    });

    const sortedFactors = Array.from(factorPerformance.entries())
      .map(([factor, perf]) => ({ factor, winRate: perf.wins / perf.total, total: perf.total }))
      .filter(f => f.total >= 3)
      .sort((a, b) => b.winRate - a.winRate);

    this.metrics.bestPerformingFactors = sortedFactors.slice(0, 5).map(f => f.factor);
    this.metrics.worstPerformingFactors = sortedFactors.slice(-5).map(f => f.factor);
  }

  private updateLearningRules(): void {
    // Create new rules based on recent performance
    const recentTrades = this.tradeHistory.slice(-20); // Last 20 trades
    
    // Rule: Avoid low confidence signals if they perform poorly
    const lowConfidenceTrades = recentTrades.filter(t => t.confidence < 0.7);
    if (lowConfidenceTrades.length >= 5) {
      const lowConfidenceWinRate = lowConfidenceTrades.filter(t => t.outcome === 'WIN' || t.outcome === 'PARTIAL').length / lowConfidenceTrades.length;
      
      if (lowConfidenceWinRate < 0.4) {
        this.addOrUpdateRule('low_confidence', 'AVOID_SIGNAL', 0.7, lowConfidenceWinRate);
      }
    }

    // Rule: Prefer high volatility for certain symbols
    const highVolTrades = recentTrades.filter(t => t.marketConditions.volatility > 0.03);
    if (highVolTrades.length >= 5) {
      const highVolWinRate = highVolTrades.filter(t => t.outcome === 'WIN' || t.outcome === 'PARTIAL').length / highVolTrades.length;
      
      if (highVolWinRate > 0.7) {
        this.addOrUpdateRule('high_volatility', 'PREFER_SIGNAL', 0.8, highVolWinRate);
      }
    }

    console.log(`🧠 Learning rules updated: ${this.learningRules.length} active rules`);
  }

  private addOrUpdateRule(condition: string, action: any, confidence: number, successRate: number): void {
    const existingRule = this.learningRules.find(r => r.condition === condition);
    
    if (existingRule) {
      existingRule.successRate = successRate;
      existingRule.confidence = confidence;
      existingRule.timesApplied++;
      existingRule.lastUpdated = new Date();
    } else {
      const newRule: LearningRule = {
        id: Math.random().toString(36).substring(2, 9),
        condition,
        action,
        confidence,
        successRate,
        timesApplied: 1,
        createdAt: new Date(),
        lastUpdated: new Date(),
        impact: successRate > 0.8 ? 'HIGH' : successRate > 0.6 ? 'MEDIUM' : 'LOW'
      };
      this.learningRules.push(newRule);
    }
  }

  private generateImprovementSuggestions(): void {
    const suggestions: string[] = [];
    
    if (this.metrics.winRate < 0.6) {
      suggestions.push('Consider increasing confidence threshold for signals');
    }
    
    if (this.metrics.avgPnL < 0) {
      suggestions.push('Review risk management - average P&L is negative');
    }
    
    // Symbol-specific suggestions
    this.metrics.symbolPerformance.forEach((perf, symbol) => {
      if (perf.winRate < 0.4 && perf.wins + perf.losses >= 10) {
        suggestions.push(`Consider avoiding ${symbol} signals - low win rate (${(perf.winRate * 100).toFixed(1)}%)`);
      }
    });
    
    this.metrics.improvementSuggestions = suggestions;
  }

  applyLearningToSignal(
    symbol: string,
    signalType: 'BUY' | 'SELL' | 'HOLD',
    confidence: number,
    reasoningFactors: string[]
  ): { adjustedConfidence: number; recommendations: string[]; shouldAvoid: boolean } {
    let adjustedConfidence = confidence;
    const recommendations: string[] = [];
    let shouldAvoid = false;

    // Apply symbol-specific learning
    const symbolPerf = this.metrics.symbolPerformance.get(symbol);
    if (symbolPerf && symbolPerf.wins + symbolPerf.losses >= 5) {
      if (symbolPerf.winRate > 0.7) {
        adjustedConfidence = Math.min(0.95, adjustedConfidence * 1.1);
        recommendations.push(`${symbol} has high historical success rate (${(symbolPerf.winRate * 100).toFixed(1)}%)`);
      } else if (symbolPerf.winRate < 0.4) {
        adjustedConfidence = adjustedConfidence * 0.8;
        recommendations.push(`${symbol} has low historical success rate (${(symbolPerf.winRate * 100).toFixed(1)}%) - reduced confidence`);
        
        if (symbolPerf.winRate < 0.3) {
          shouldAvoid = true;
          recommendations.push(`Avoiding ${symbol} due to very poor performance`);
        }
      }
    }

    // Apply factor-based learning
    reasoningFactors.forEach(factor => {
      if (this.metrics.bestPerformingFactors.includes(factor)) {
        adjustedConfidence = Math.min(0.95, adjustedConfidence * 1.05);
        recommendations.push(`High-performing factor detected: ${factor}`);
      } else if (this.metrics.worstPerformingFactors.includes(factor)) {
        adjustedConfidence = adjustedConfidence * 0.9;
        recommendations.push(`Low-performing factor detected: ${factor} - proceed with caution`);
      }
    });

    // Apply learning rules
    this.learningRules.forEach(rule => {
      if (rule.condition === 'low_confidence' && confidence < 0.7 && rule.action === 'AVOID_SIGNAL') {
        shouldAvoid = true;
        recommendations.push('Avoiding low confidence signal based on learning');
      }
      
      if (rule.condition === 'high_volatility' && rule.action === 'PREFER_SIGNAL') {
        adjustedConfidence = Math.min(0.95, adjustedConfidence * 1.03);
        recommendations.push('High volatility conditions favor this setup');
      }
    });

    return {
      adjustedConfidence: Math.max(0.3, Math.min(0.95, adjustedConfidence)),
      recommendations,
      shouldAvoid
    };
  }

  getMetrics(): LearningMetrics {
    return { ...this.metrics };
  }

  getLearningInsights(): string[] {
    const insights: string[] = [];
    
    if (this.metrics.totalTrades > 5) {
      insights.push(`Overall win rate: ${(this.metrics.winRate * 100).toFixed(1)}% over ${this.metrics.totalTrades} trades`);
      insights.push(`Average P&L per trade: ${this.metrics.avgPnL.toFixed(2)}%`);
      
      if (this.metrics.bestPerformingFactors.length > 0) {
        insights.push(`Best performing factors: ${this.metrics.bestPerformingFactors.slice(0, 3).join(', ')}`);
      }
      
      // Symbol-specific insights
      this.metrics.symbolPerformance.forEach((perf, symbol) => {
        const total = perf.wins + perf.losses;
        if (total >= 3) {
          insights.push(`${symbol}: ${(perf.winRate * 100).toFixed(1)}% win rate, avg P&L: ${perf.avgPnL.toFixed(2)}%`);
        }
      });

      // Improvement suggestions
      if (this.metrics.improvementSuggestions.length > 0) {
        insights.push(...this.metrics.improvementSuggestions);
      }
    } else {
      insights.push('Collecting data for learning analysis...');
    }

    return insights;
  }

  getTradeHistory(): TradeOutcome[] {
    return [...this.tradeHistory];
  }

  getLearningRules(): LearningRule[] {
    return [...this.learningRules];
  }
}