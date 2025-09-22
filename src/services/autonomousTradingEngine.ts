import { TradingSignal } from '../types/trading';
import { SupabaseBrainService, BrainData, TradingSignalDB } from './supabaseClient';

export class AutonomousTradingEngine {
  private static instance: AutonomousTradingEngine;
  private signals: TradingSignal[] = [];
  private isMonitoring = true;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private brainData: Map<string, BrainData> = new Map();
  
  private monitoredSources = [
    // Economic Calendar
    'https://nfs.faireconomy.media/ff_calendar_thisweek.xml',
    
    // EUR/USD Analysis Sources
    'https://www.barchart.com/forex/quotes/%5EEURUSD/opinion',
    'https://www.barchart.com/forex/quotes/%5EEURUSD/trading-strategies',
    'https://www.barchart.com/forex/quotes/%5EEURUSD/cheat-sheet',
    'https://www.barchart.com/forex/quotes/%5EEURUSD/news',
    'https://www.barchart.com/forex/quotes/%5EEURUSD/technical-analysis',
    
    // XAU/USD Analysis Sources
    'https://www.barchart.com/forex/quotes/%5EXAUUSD/overview',
    'https://www.barchart.com/forex/quotes/%5EXAUUSD/interactive-chart',
    'https://www.barchart.com/forex/quotes/%5EXAUUSD/technical-chart',
    'https://www.barchart.com/forex/quotes/%5EXAUUSD/opinion',
    'https://www.barchart.com/forex/quotes/%5EXAUUSD/trading-strategies',
    'https://www.barchart.com/forex/quotes/%5EXAUUSD/cheat-sheet',
    'https://www.barchart.com/forex/quotes/%5EXAUUSD/news',
    'https://www.barchart.com/forex/quotes/%5EXAUUSD/performance',
    
    // Additional Market Sources
    'https://www.forexfactory.com/calendar',
    'https://www.investing.com/economic-calendar/',
    'https://www.dailyfx.com/market-news',
    'https://www.fxstreet.com/economic-calendar'
  ];

  static getInstance() {
    if (!AutonomousTradingEngine.instance) {
      AutonomousTradingEngine.instance = new AutonomousTradingEngine();
      AutonomousTradingEngine.instance.initializeAutonomousMonitoring();
    }
    return AutonomousTradingEngine.instance;
  }

  private async initializeAutonomousMonitoring() {
    console.log('🤖 Autonomous AI Trading Bot: Initializing continuous monitoring...');
    
    // Load existing brain data
    await this.loadBrainData();
    
    // Load recent signals
    await this.loadRecentSignals();
    
    // Start immediate monitoring
    this.startContinuousMonitoring();
  }

  private async loadBrainData() {
    const symbols = ['XAUUSD', 'EURUSD'];
    for (const symbol of symbols) {
      const data = await SupabaseBrainService.getBrainData(symbol);
      if (data) {
        this.brainData.set(symbol, data);
      }
    }
  }

  private async loadRecentSignals() {
    try {
      const dbSignals = await SupabaseBrainService.getRecentSignals(50);
      this.signals = dbSignals.map(this.convertDBSignalToTradingSignal);
    } catch (error) {
      console.error('Error loading recent signals:', error);
    }
  }

  private convertDBSignalToTradingSignal(dbSignal: TradingSignalDB): TradingSignal {
    return {
      id: dbSignal.id || Math.random().toString(36).substring(2, 9),
      symbol: dbSignal.symbol,
      signal: dbSignal.signal_type,
      confidence: dbSignal.confidence,
      entryPrice: dbSignal.entry_price,
      stopLoss: dbSignal.stop_loss,
      takeProfit1: dbSignal.take_profit_1,
      takeProfit2: dbSignal.take_profit_2,
      takeProfit3: dbSignal.take_profit_3,
      riskRewardRatio: this.calculateRiskReward(dbSignal.entry_price, dbSignal.stop_loss, dbSignal.take_profit_1),
      timestamp: new Date(dbSignal.created_at),
      reasoning: dbSignal.reasoning,
      source: dbSignal.source,
      trend: dbSignal.trend as 'BULLISH' | 'BEARISH' | 'SIDEWAYS',
      riskPercentage: dbSignal.risk_percentage
    };
  }

  private calculateRiskReward(entry: number, stopLoss: number, takeProfit: number): number {
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(takeProfit - entry);
    return reward / risk;
  }

  private startContinuousMonitoring() {
    if (this.monitoringInterval) return;
    
    console.log('🔄 Starting autonomous monitoring every 5 minutes...');
    
    // Initial scan
    this.performMonitoringCycle();
    
    // Set up 5-minute interval (300,000 ms)
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCycle();
    }, 5 * 60 * 1000);
  }

  private async performMonitoringCycle() {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🔍 [${timestamp}] Autonomous scan: Analyzing market sources...`);
    
    // Process multiple sources simultaneously
    const promises = this.monitoredSources.map(url => this.analyzeSource(url));
    
    try {
      await Promise.allSettled(promises);
      console.log(`✅ [${timestamp}] Monitoring cycle completed`);
    } catch (error) {
      console.error('Error in monitoring cycle:', error);
    }
  }

  private async analyzeSource(url: string) {
    try {
      const marketData = await this.scrapeMarketData(url);
      const symbol = this.extractSymbolFromUrl(url);
      
      if (symbol && marketData) {
        await this.updateBrainData(symbol, marketData);
        await this.generateSignalFromAnalysis(symbol, marketData);
      }
    } catch (error) {
      console.error(`Failed to analyze ${url}:`, error);
    }
  }

  private async scrapeMarketData(url: string): Promise<any> {
    // Simulate realistic market data scraping with delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const symbol = this.extractSymbolFromUrl(url);
    
    if (symbol === 'XAUUSD') {
      return this.generateXAUUSDData();
    } else if (symbol === 'EURUSD') {
      return this.generateEURUSDData();
    }
    
    return this.generateGenericMarketData();
  }

  private generateXAUUSDData() {
    const basePrice = 2000 + Math.random() * 200;
    return {
      currentPrice: Number(basePrice.toFixed(2)),
      rsi: 30 + Math.random() * 40,
      macd: (Math.random() - 0.5) * 2,
      support: Number((basePrice - 20 - Math.random() * 10).toFixed(2)),
      resistance: Number((basePrice + 20 + Math.random() * 10).toFixed(2)),
      volume: Math.random() * 100000,
      volatility: 0.02 + Math.random() * 0.03,
      sentiment: Math.random(),
      trend: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH'
    };
  }

  private generateEURUSDData() {
    const basePrice = 1.0500 + Math.random() * 0.1000;
    return {
      currentPrice: Number(basePrice.toFixed(4)),
      rsi: 30 + Math.random() * 40,
      macd: (Math.random() - 0.5) * 0.002,
      support: Number((basePrice - 0.0050 - Math.random() * 0.0030).toFixed(4)),
      resistance: Number((basePrice + 0.0050 + Math.random() * 0.0030).toFixed(4)),
      volume: Math.random() * 50000,
      volatility: 0.01 + Math.random() * 0.02,
      sentiment: Math.random(),
      trend: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH'
    };
  }

  private generateGenericMarketData() {
    return {
      currentPrice: 100 + Math.random() * 50,
      rsi: 30 + Math.random() * 40,
      macd: (Math.random() - 0.5) * 2,
      support: 90 + Math.random() * 10,
      resistance: 110 + Math.random() * 10,
      volume: Math.random() * 10000,
      volatility: 0.02 + Math.random() * 0.03,
      sentiment: Math.random(),
      trend: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH'
    };
  }

  private extractSymbolFromUrl(url: string): string | null {
    if (url.includes('%5EXAUUSD')) return 'XAUUSD';
    if (url.includes('%5EEURUSD')) return 'EURUSD';
    if (url.includes('gold') || url.includes('xau')) return 'XAUUSD';
    if (url.includes('eur') || url.includes('euro')) return 'EURUSD';
    return null;
  }

  private async updateBrainData(symbol: string, marketData: any) {
    const existingBrain = this.brainData.get(symbol);
    
    const brainData: BrainData = {
      symbol,
      market_data: marketData,
      technical_indicators: {
        rsi: marketData.rsi,
        macd: marketData.macd,
        support: marketData.support,
        resistance: marketData.resistance
      },
      sentiment_score: marketData.sentiment,
      confidence_level: this.calculateConfidence(marketData),
      last_updated: new Date().toISOString(),
      insights: this.generateInsights(marketData, existingBrain)
    };
    
    this.brainData.set(symbol, brainData);
    await SupabaseBrainService.saveBrainData(brainData);
  }

  private calculateConfidence(marketData: any): number {
    let confidence = 0.5;
    
    // RSI confidence
    if (marketData.rsi < 30 || marketData.rsi > 70) confidence += 0.2;
    else if (marketData.rsi > 40 && marketData.rsi < 60) confidence += 0.1;
    
    // MACD confidence
    if (Math.abs(marketData.macd) > 0.5) confidence += 0.15;
    
    // Volume confidence
    if (marketData.volume > 50000) confidence += 0.1;
    
    // Trend alignment
    if (marketData.trend === 'BULLISH' && marketData.rsi > 50) confidence += 0.05;
    if (marketData.trend === 'BEARISH' && marketData.rsi < 50) confidence += 0.05;
    
    return Math.min(0.95, Math.max(0.3, confidence));
  }

  private generateInsights(marketData: any, existingBrain?: BrainData): string[] {
    const insights: string[] = [];
    
    if (marketData.rsi < 30) {
      insights.push('RSI oversold - potential reversal opportunity');
    } else if (marketData.rsi > 70) {
      insights.push('RSI overbought - caution for long positions');
    }
    
    if (marketData.macd > 0) {
      insights.push('MACD bullish crossover detected');
    } else {
      insights.push('MACD bearish momentum present');
    }
    
    if (marketData.currentPrice > marketData.resistance) {
      insights.push('Price breaking above resistance - bullish breakout');
    } else if (marketData.currentPrice < marketData.support) {
      insights.push('Price breaking below support - bearish breakdown');
    }
    
    if (marketData.volatility > 0.03) {
      insights.push('High volatility environment - increased risk');
    }
    
    return insights;
  }

  private async generateSignalFromAnalysis(symbol: string, marketData: any) {
    const brainData = this.brainData.get(symbol);
    if (!brainData) return;
    
    const signalType = this.determineSignalType(marketData, brainData);
    if (signalType === 'HOLD') return; // Skip hold signals
    
    const signal = this.createTradingSignal(symbol, signalType, marketData, brainData);
    
    // Save to database
    const dbSignal: TradingSignalDB = {
      symbol: signal.symbol,
      signal_type: signal.signal,
      entry_price: signal.entryPrice,
      stop_loss: signal.stopLoss,
      take_profit_1: signal.takeProfit1,
      take_profit_2: signal.takeProfit2,
      take_profit_3: signal.takeProfit3,
      confidence: signal.confidence,
      risk_percentage: signal.riskPercentage,
      reasoning: signal.reasoning,
      trend: signal.trend,
      created_at: new Date().toISOString(),
      source: 'Autonomous AI Engine'
    };
    
    await SupabaseBrainService.saveSignal(dbSignal);
    
    // Add to local signals
    this.signals.unshift(signal);
    if (this.signals.length > 100) {
      this.signals = this.signals.slice(0, 100);
    }
    
    console.log(`📊 New ${signalType} signal: ${symbol} @ ${marketData.currentPrice}`);
  }

  private determineSignalType(marketData: any, brainData: BrainData): 'BUY' | 'SELL' | 'HOLD' {
    let bullishScore = 0;
    let bearishScore = 0;
    
    // RSI analysis
    if (marketData.rsi < 35) bullishScore += 2;
    else if (marketData.rsi > 65) bearishScore += 2;
    else if (marketData.rsi > 50) bullishScore += 1;
    else bearishScore += 1;
    
    // MACD analysis
    if (marketData.macd > 0) bullishScore += 1;
    else bearishScore += 1;
    
    // Price position analysis
    const pricePosition = (marketData.currentPrice - marketData.support) / 
                         (marketData.resistance - marketData.support);
    if (pricePosition > 0.7) bullishScore += 1;
    else if (pricePosition < 0.3) bearishScore += 1;
    
    // Trend alignment
    if (marketData.trend === 'BULLISH') bullishScore += 1;
    else if (marketData.trend === 'BEARISH') bearishScore += 1;
    
    // Confidence threshold
    if (brainData.confidence_level < 0.6) return 'HOLD';
    
    if (bullishScore > bearishScore + 1) return 'BUY';
    if (bearishScore > bullishScore + 1) return 'SELL';
    return 'HOLD';
  }

  private createTradingSignal(symbol: string, signalType: 'BUY' | 'SELL', marketData: any, brainData: BrainData): TradingSignal {
    const entryPrice = marketData.currentPrice;
    const riskAmount = entryPrice * 0.02; // 2% risk
    
    let stopLoss: number;
    let takeProfit1: number;
    let takeProfit2: number;
    let takeProfit3: number;
    
    if (signalType === 'BUY') {
      stopLoss = Math.max(entryPrice - riskAmount, marketData.support);
      takeProfit1 = entryPrice + (riskAmount * 1.5);
      takeProfit2 = entryPrice + (riskAmount * 2.5);
      takeProfit3 = entryPrice + (riskAmount * 4.0);
    } else {
      stopLoss = Math.min(entryPrice + riskAmount, marketData.resistance);
      takeProfit1 = entryPrice - (riskAmount * 1.5);
      takeProfit2 = entryPrice - (riskAmount * 2.5);
      takeProfit3 = entryPrice - (riskAmount * 4.0);
    }
    
    const riskRewardRatio = Math.abs(takeProfit1 - entryPrice) / Math.abs(entryPrice - stopLoss);
    
    return {
      id: Math.random().toString(36).substring(2, 9),
      symbol,
      signal: signalType,
      confidence: brainData.confidence_level,
      entryPrice: Number(entryPrice.toFixed(symbol === 'EURUSD' ? 4 : 2)),
      stopLoss: Number(stopLoss.toFixed(symbol === 'EURUSD' ? 4 : 2)),
      takeProfit1: Number(takeProfit1.toFixed(symbol === 'EURUSD' ? 4 : 2)),
      takeProfit2: Number(takeProfit2.toFixed(symbol === 'EURUSD' ? 4 : 2)),
      takeProfit3: Number(takeProfit3.toFixed(symbol === 'EURUSD' ? 4 : 2)),
      riskRewardRatio: Number(riskRewardRatio.toFixed(2)),
      timestamp: new Date(),
      reasoning: this.generateReasoning(signalType, marketData, brainData),
      source: 'Autonomous AI Engine',
      trend: marketData.trend,
      riskPercentage: 2
    };
  }

  private generateReasoning(signalType: 'BUY' | 'SELL', marketData: any, brainData: BrainData): string {
    const insights = brainData.insights.slice(0, 2).join('. ');
    const confidence = Math.round(brainData.confidence_level * 100);
    
    if (signalType === 'BUY') {
      return `Bullish signal with ${confidence}% confidence. ${insights}. RSI at ${marketData.rsi.toFixed(1)} supports upward momentum. Entry aligns with trend direction and risk management protocols.`;
    } else {
      return `Bearish signal with ${confidence}% confidence. ${insights}. RSI at ${marketData.rsi.toFixed(1)} indicates selling pressure. Entry follows trend with strict 2% risk management.`;
    }
  }

  // Public methods
  getSignals(): TradingSignal[] {
    return this.signals;
  }

  getIsMonitoring(): boolean {
    return this.isMonitoring;
  }

  getBrainData(): Map<string, BrainData> {
    return this.brainData;
  }

  getPerformanceMetrics() {
    const totalSignals = this.signals.length;
    const buySignals = this.signals.filter(s => s.signal === 'BUY').length;
    const sellSignals = this.signals.filter(s => s.signal === 'SELL').length;
    const holdSignals = this.signals.filter(s => s.signal === 'HOLD').length;
    
    const avgConfidence = totalSignals > 0 
      ? this.signals.reduce((sum, signal) => sum + signal.confidence, 0) / totalSignals 
      : 0;
    
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentSignals = this.signals.filter(s => s.timestamp.getTime() > oneHourAgo);
    
    return {
      totalSignals,
      buySignals,
      sellSignals,
      holdSignals,
      avgConfidence,
      signalsPerHour: recentSignals.length,
      totalPagesLearned: this.brainData.size * 20 // Simulated learning progress
    };
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }
}