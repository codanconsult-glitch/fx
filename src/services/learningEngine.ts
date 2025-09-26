interface TradeOutcome {
  signalId: string;
  symbol: string;
  signalType: 'BUY' | 'SELL' | 'HOLD';
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  confidence: number;
  timestamp: Date;
  outcome: 'WIN' | 'LOSS' | 'PARTIAL' | 'PENDING';
  pnl?: number;
  pnlPercentage?: number;
  reasoningFactors: string[];
  marketConditions: {
    volatility: number;
    trend: string;
    newsImpact: string;
    tradingViewSentiment: string;
  };
  lessonsLearned: string[];
}

interface LearningMetrics {
  totalTrades: number;
  winRate: number;
  avgPnL: number;
  avgConfidence: number;
  bestPerformingFactors: string[];
  worstPerformingFactors: string[];
  symbolPerformance: Map<string, { wins: number; losses: number; avgPnL: number }>;
  timeframePerformance: Map<string, { wins: number; losses: number }>;
  confidenceAccuracy: Map<string, number>; // confidence range -> actual win rate
}

interface LearningRule {
  id: string;
  condition: string;
  action: string;
  confidence: number;
  successRate: number;
  timesApplied: number;
  createdAt: Date;
  lastUpdated: Date;
}

export class LearningEngine {
  private static instance: LearningEngine;
  private tradeHistory: TradeOutcome[] = [];
  private learningRules: LearningRule[] = [];
  private metrics: LearningMetrics;

  constructor() {
    this.metrics = {
      totalTrades: 0,
      winRate: 0,
      avgPnL: 0,
      avgConfidence: 0,
      bestPerformingFactors: [],
      worstPerformingFactors: [],
      symbolPerformance: new Map(),
      timeframePerformance: new Map(),
      confidenceAccuracy: new Map()
    };
    this.loadLearningData();
  }

  static getInstance(): LearningEngine {
    if (!LearningEngine.instance) {
      LearningEngine.instance = new LearningEngine();
    }
    return LearningEngine.instance;
  }

  private loadLearningData(): void {
    try {
      const storedHistory = localStorage.getItem('ai_trade_history');
      if (storedHistory) {
        this.tradeHistory = JSON.parse(storedHistory).map((trade: any) => ({
          ...trade,
          timestamp: new Date(trade.timestamp)
        }));
      }

      const storedRules = localStorage.getItem('ai_learning_rules');
      if (storedRules) {
        this.learningRules = JSON.parse(storedRules).map((rule: any) => ({
          ...rule,
          createdAt: new Date(rule.createdAt),
          lastUpdated: new Date(rule.lastUpdated)
        }));
      }

      this.updateMetrics();
      console.log(`📚 Learning Engine loaded: ${this.tradeHistory.length} trades, ${this.learningRules.length} rules`);
    } catch (error) {
      console.error('Error loading learning data:', error);
    }
  }

  private saveLearningData(): void {
    try {
      localStorage.setItem('ai_trade_history', JSON.stringify(this.tradeHistory));
      localStorage.setItem('ai_learning_rules', JSON.stringify(this.learningRules));
    } catch (error) {
      console.error('Error saving learning data:', error);
    }
  }

  recordTrade(
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
  ): void {
    const trade: TradeOutcome = {
      signalId,
      symbol,
      signalType,
      entryPrice,
      stopLoss,
      takeProfit1,
      takeProfit2,
      takeProfit3,
      confidence,
      timestamp: new Date(),
      outcome: 'PENDING',
      reasoningFactors,
      marketConditions,
      lessonsLearned: []
    };

    this.tradeHistory.push(trade);
    this.saveLearningData();
    
    console.log(`📝 Trade recorded: ${signalType} ${symbol} @ ${entryPrice}`);
  }

  updateTradeOutcome(signalId: string, exitPrice: number, outcome: 'WIN' | 'LOSS' | 'PARTIAL'): void {
    const trade = this.tradeHistory.find(t => t.signalId === signalId);
    if (!trade) {
      console.warn(`Trade ${signalId} not found for outcome update`);
      return;
    }

    trade.exitPrice = exitPrice;
    trade.outcome = outcome;
    
    // Calculate P&L
    if (trade.signalType === 'BUY') {
      trade.pnl = exitPrice - trade.entryPrice;
    } else if (trade.signalType === 'SELL') {
      trade.pnl = trade.entryPrice - exitPrice;
    }
    
    trade.pnlPercentage = trade.pnl ? (trade.pnl / trade.entryPrice) * 100 : 0;

    // Generate lessons learned
    trade.lessonsLearned = this.generateLessons(trade);

    // Update learning rules
    this.updateLearningRules(trade);

    // Update metrics
    this.updateMetrics();

    this.saveLearningData();
    
    console.log(`📊 Trade outcome updated: ${outcome} for ${trade.symbol} (P&L: ${trade.pnlPercentage?.toFixed(2)}%)`);
  }

  private generateLessons(trade: TradeOutcome): string[] {
    const lessons: string[] = [];

    if (trade.outcome === 'WIN') {
      lessons.push(`${trade.symbol} ${trade.signalType} signals work well with ${trade.confidence.toFixed(2)} confidence`);
      
      if (trade.marketConditions.volatility > 0.03) {
        lessons.push('High volatility conditions favor this setup');
      }
      
      if (trade.marketConditions.tradingViewSentiment === trade.signalType) {
        lessons.push('TradingView sentiment alignment increases success rate');
      }
    } else if (trade.outcome === 'LOSS') {
      lessons.push(`${trade.symbol} ${trade.signalType} signals need refinement at ${trade.confidence.toFixed(2)} confidence`);
      
      if (trade.marketConditions.newsImpact === 'HIGH') {
        lessons.push('Avoid trading during high impact news events');
      }
      
      if (trade.marketConditions.trend !== trade.signalType) {
        lessons.push('Avoid trading against the overall trend');
      }
    }

    return lessons;
  }

  private updateLearningRules(trade: TradeOutcome): void {
    // Create or update rules based on trade outcome
    trade.reasoningFactors.forEach(factor => {
      const existingRule = this.learningRules.find(r => r.condition.includes(factor));
      
      if (existingRule) {
        existingRule.timesApplied++;
        if (trade.outcome === 'WIN') {
          existingRule.successRate = (existingRule.successRate * (existingRule.timesApplied - 1) + 1) / existingRule.timesApplied;
        } else {
          existingRule.successRate = (existingRule.successRate * (existingRule.timesApplied - 1)) / existingRule.timesApplied;
        }
        existingRule.lastUpdated = new Date();
      } else {
        // Create new rule
        const newRule: LearningRule = {
          id: Math.random().toString(36).substring(2, 9),
          condition: factor,
          action: trade.outcome === 'WIN' ? 'INCREASE_CONFIDENCE' : 'DECREASE_CONFIDENCE',
          confidence: trade.confidence,
          successRate: trade.outcome === 'WIN' ? 1 : 0,
          timesApplied: 1,
          createdAt: new Date(),
          lastUpdated: new Date()
        };
        this.learningRules.push(newRule);
      }
    });

    // Remove rules with very low success rates
    this.learningRules = this.learningRules.filter(rule => 
      rule.successRate > 0.2 || rule.timesApplied < 5
    );
  }

  private updateMetrics(): void {
    const completedTrades = this.tradeHistory.filter(t => t.outcome !== 'PENDING');
    
    this.metrics.totalTrades = completedTrades.length;
    
    if (completedTrades.length > 0) {
      const wins = completedTrades.filter(t => t.outcome === 'WIN').length;
      this.metrics.winRate = wins / completedTrades.length;
      
      const totalPnL = completedTrades.reduce((sum, t) => sum + (t.pnlPercentage || 0), 0);
      this.metrics.avgPnL = totalPnL / completedTrades.length;
      
      const totalConfidence = completedTrades.reduce((sum, t) => sum + t.confidence, 0);
      this.metrics.avgConfidence = totalConfidence / completedTrades.length;
    }

    // Update symbol performance
    this.metrics.symbolPerformance.clear();
    completedTrades.forEach(trade => {
      const existing = this.metrics.symbolPerformance.get(trade.symbol) || { wins: 0, losses: 0, avgPnL: 0 };
      
      if (trade.outcome === 'WIN') existing.wins++;
      else existing.losses++;
      
      existing.avgPnL = (existing.avgPnL * (existing.wins + existing.losses - 1) + (trade.pnlPercentage || 0)) / (existing.wins + existing.losses);
      
      this.metrics.symbolPerformance.set(trade.symbol, existing);
    });

    // Update best/worst performing factors
    const factorPerformance = new Map<string, { wins: number; total: number }>();
    
    completedTrades.forEach(trade => {
      trade.reasoningFactors.forEach(factor => {
        const existing = factorPerformance.get(factor) || { wins: 0, total: 0 };
        existing.total++;
        if (trade.outcome === 'WIN') existing.wins++;
        factorPerformance.set(factor, existing);
      });
    });

    const sortedFactors = Array.from(factorPerformance.entries())
      .map(([factor, perf]) => ({ factor, winRate: perf.wins / perf.total, total: perf.total }))
      .filter(f => f.total >= 3) // Only consider factors used at least 3 times
      .sort((a, b) => b.winRate - a.winRate);

    this.metrics.bestPerformingFactors = sortedFactors.slice(0, 5).map(f => f.factor);
    this.metrics.worstPerformingFactors = sortedFactors.slice(-5).map(f => f.factor);
  }

  applyLearningToSignal(
    symbol: string,
    signalType: 'BUY' | 'SELL' | 'HOLD',
    confidence: number,
    reasoningFactors: string[]
  ): { adjustedConfidence: number; recommendations: string[] } {
    let adjustedConfidence = confidence;
    const recommendations: string[] = [];

    // Apply symbol-specific learning
    const symbolPerf = this.metrics.symbolPerformance.get(symbol);
    if (symbolPerf) {
      const symbolWinRate = symbolPerf.wins / (symbolPerf.wins + symbolPerf.losses);
      if (symbolWinRate > 0.7) {
        adjustedConfidence = Math.min(0.95, adjustedConfidence * 1.1);
        recommendations.push(`${symbol} has high historical success rate (${(symbolWinRate * 100).toFixed(1)}%)`);
      } else if (symbolWinRate < 0.4) {
        adjustedConfidence = adjustedConfidence * 0.9;
        recommendations.push(`${symbol} has low historical success rate (${(symbolWinRate * 100).toFixed(1)}%) - reduced confidence`);
      }
    }

    // Apply factor-based learning
    reasoningFactors.forEach(factor => {
      if (this.metrics.bestPerformingFactors.includes(factor)) {
        adjustedConfidence = Math.min(0.95, adjustedConfidence * 1.05);
        recommendations.push(`High-performing factor detected: ${factor}`);
      } else if (this.metrics.worstPerformingFactors.includes(factor)) {
        adjustedConfidence = adjustedConfidence * 0.95;
        recommendations.push(`Low-performing factor detected: ${factor} - proceed with caution`);
      }
    });

    // Apply learning rules
    this.learningRules.forEach(rule => {
      if (reasoningFactors.some(factor => factor.includes(rule.condition))) {
        if (rule.successRate > 0.7 && rule.action === 'INCREASE_CONFIDENCE') {
          adjustedConfidence = Math.min(0.95, adjustedConfidence * 1.03);
        } else if (rule.successRate < 0.4 && rule.action === 'DECREASE_CONFIDENCE') {
          adjustedConfidence = adjustedConfidence * 0.97;
        }
      }
    });

    return {
      adjustedConfidence: Math.max(0.3, Math.min(0.95, adjustedConfidence)),
      recommendations
    };
  }

  getMetrics(): LearningMetrics {
    return { ...this.metrics };
  }

  getLearningInsights(): string[] {
    const insights: string[] = [];
    
    if (this.metrics.totalTrades > 10) {
      insights.push(`Overall win rate: ${(this.metrics.winRate * 100).toFixed(1)}% over ${this.metrics.totalTrades} trades`);
      insights.push(`Average P&L per trade: ${this.metrics.avgPnL.toFixed(2)}%`);
      
      if (this.metrics.bestPerformingFactors.length > 0) {
        insights.push(`Best performing factors: ${this.metrics.bestPerformingFactors.slice(0, 3).join(', ')}`);
      }
      
      // Symbol-specific insights
      this.metrics.symbolPerformance.forEach((perf, symbol) => {
        const total = perf.wins + perf.losses;
        if (total >= 5) {
          const winRate = (perf.wins / total * 100).toFixed(1);
          insights.push(`${symbol}: ${winRate}% win rate, avg P&L: ${perf.avgPnL.toFixed(2)}%`);
        }
      });
    } else {
      insights.push('Collecting data for learning analysis...');
    }

    return insights;
  }

  // Simulate trade outcomes for testing (in real implementation, this would be called by market monitoring)
  simulateTradeOutcomes(): void {
    const pendingTrades = this.tradeHistory.filter(t => t.outcome === 'PENDING');
    
    pendingTrades.forEach(trade => {
      // Simulate random outcomes for demonstration
      const random = Math.random();
      let outcome: 'WIN' | 'LOSS' | 'PARTIAL';
      let exitPrice: number;
      
      if (random > 0.6) {
        outcome = 'WIN';
        exitPrice = trade.signalType === 'BUY' ? 
          trade.takeProfit1 + Math.random() * (trade.takeProfit2 - trade.takeProfit1) :
          trade.takeProfit1 - Math.random() * (trade.takeProfit1 - trade.takeProfit2);
      } else {
        outcome = 'LOSS';
        exitPrice = trade.stopLoss;
      }
      
      this.updateTradeOutcome(trade.signalId, exitPrice, outcome);
    });
  }
}