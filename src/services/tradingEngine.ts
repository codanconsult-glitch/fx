import { TradingSignal, LearningSession } from '../types/trading';

export class TradingEngine {
  private static instance: TradingEngine;
  private signals: TradingSignal[] = [];
  private isGeneratingSignals = false;
  private learningData: LearningSession[] = [];

  static getInstance() {
    if (!TradingEngine.instance) {
      TradingEngine.instance = new TradingEngine();
    }
    return TradingEngine.instance;
  }

  startAutonomousTrading() {
    if (this.isGeneratingSignals) return;
    
    this.isGeneratingSignals = true;
    this.generatePeriodicSignals();
  }

  stopAutonomousTrading() {
    this.isGeneratingSignals = false;
  }

  private generatePeriodicSignals() {
    if (!this.isGeneratingSignals) return;

    // Generate a new signal every 15-30 seconds
    const interval = 15000 + Math.random() * 15000;
    
    setTimeout(() => {
      this.generateTradingSignal();
      this.generatePeriodicSignals();
    }, interval);
  }

  private generateTradingSignal() {
    const symbols = ['BTC/USD', 'ETH/USD', 'TSLA', 'AAPL', 'GOOGL', 'MSFT', 'AMZN'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    const sentimentScore = this.analyzeSentiment();
    const technicalScore = this.performTechnicalAnalysis();
    const combinedScore = (sentimentScore + technicalScore) / 2;
    
    let signal: 'BUY' | 'SELL' | 'HOLD';
    let confidence: number;
    let reasoning: string;
    
    if (combinedScore > 0.7) {
      signal = 'BUY';
      confidence = Math.min(0.95, combinedScore + Math.random() * 0.1);
      reasoning = `Strong bullish signals detected. Sentiment analysis shows positive momentum with technical indicators confirming upward trend.`;
    } else if (combinedScore < 0.3) {
      signal = 'SELL';
      confidence = Math.min(0.95, (1 - combinedScore) + Math.random() * 0.1);
      reasoning = `Bearish patterns identified. Market sentiment suggests potential downside with technical support levels breaking.`;
    } else {
      signal = 'HOLD';
      confidence = 0.6 + Math.random() * 0.2;
      reasoning = `Mixed signals detected. Recommending hold position while monitoring for clearer directional momentum.`;
    }

    const newSignal: TradingSignal = {
      id: Math.random().toString(36).substring(2, 9),
      symbol,
      signal,
      confidence,
      price: this.generatePrice(symbol),
      timestamp: new Date(),
      reasoning,
      source: 'AI Learning Engine'
    };

    this.signals.unshift(newSignal);
    
    // Keep only last 50 signals
    if (this.signals.length > 50) {
      this.signals = this.signals.slice(0, 50);
    }
  }

  private analyzeSentiment(): number {
    if (this.learningData.length === 0) return 0.5;
    
    const recentSessions = this.learningData.slice(-5);
    let sentimentScore = 0.5;
    
    recentSessions.forEach(session => {
      const content = session.content.toLowerCase();
      const insights = session.extractedInsights;
      
      const bullishCount = insights.filter(insight => insight.includes('Bullish')).length;
      const bearishCount = insights.filter(insight => insight.includes('Bearish')).length;
      
      if (bullishCount > bearishCount) {
        sentimentScore += 0.1;
      } else if (bearishCount > bullishCount) {
        sentimentScore -= 0.1;
      }
    });
    
    return Math.max(0, Math.min(1, sentimentScore));
  }

  private performTechnicalAnalysis(): number {
    // Simulate technical analysis based on random market conditions
    const indicators = [
      Math.random(), // RSI
      Math.random(), // MACD
      Math.random(), // Moving Average
      Math.random(), // Volume
      Math.random()  // Momentum
    ];
    
    return indicators.reduce((sum, indicator) => sum + indicator, 0) / indicators.length;
  }

  private generatePrice(symbol: string): number {
    const basePrices: { [key: string]: number } = {
      'BTC/USD': 43000,
      'ETH/USD': 2600,
      'TSLA': 240,
      'AAPL': 185,
      'GOOGL': 140,
      'MSFT': 375,
      'AMZN': 145
    };
    
    const basePrice = basePrices[symbol] || 100;
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    return Number((basePrice * (1 + variation)).toFixed(2));
  }

  updateLearningData(sessions: LearningSession[]) {
    this.learningData = sessions;
  }

  getSignals(): TradingSignal[] {
    return this.signals;
  }

  getPerformanceMetrics() {
    const totalSignals = this.signals.length;
    const buySignals = this.signals.filter(s => s.signal === 'BUY').length;
    const sellSignals = this.signals.filter(s => s.signal === 'SELL').length;
    const holdSignals = this.signals.filter(s => s.signal === 'HOLD').length;
    
    const avgConfidence = this.signals.reduce((sum, signal) => sum + signal.confidence, 0) / totalSignals || 0;
    
    return {
      totalSignals,
      buySignals,
      sellSignals,
      holdSignals,
      avgConfidence,
      signalsPerHour: totalSignals > 0 ? (totalSignals / ((Date.now() - this.signals[this.signals.length - 1]?.timestamp.getTime() || Date.now()) / 3600000)) : 0
    };
  }
}