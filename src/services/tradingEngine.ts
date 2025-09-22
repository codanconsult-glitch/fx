import { TradingSignal, LearningSession } from '../types/trading';
import { WebScrapingService } from './webScraper';

export class TradingEngine {
  private static instance: TradingEngine;
  private signals: TradingSignal[] = [];
  private isMonitoring = false;
  private learningData: LearningSession[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private webScraper = WebScrapingService.getInstance();
  private monitoredUrls = [
    'https://www.barchart.com/forex/quotes/%5EXAUUSD/cheat-sheet',
    'https://www.barchart.com/forex/quotes/%5EEURUSD/cheat-sheet'
  ];

  static getInstance() {
    if (!TradingEngine.instance) {
      TradingEngine.instance = new TradingEngine();
      // Start monitoring immediately when instance is created
      TradingEngine.instance.startContinuousMonitoring();
    }
    return TradingEngine.instance;
  }

  private startContinuousMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🤖 AI Bot: Starting continuous monitoring every 5 minutes...');
    
    // Initial scan
    this.performMonitoringCycle();
    
    // Set up 5-minute interval
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCycle();
    }, 5 * 60 * 1000); // 5 minutes
  }

  private async performMonitoringCycle() {
    console.log('🔍 Scanning market sources for new signals...');
    
    for (const url of this.monitoredUrls) {
      try {
        const session = await this.webScraper.scrapeWebpage(url);
        this.updateLearningData([...this.learningData, session]);
        await this.generateTradingSignalFromData(session);
      } catch (error) {
        console.error(`Failed to monitor ${url}:`, error);
      }
    }
  }

  startAutonomousTrading() {
    // This method now just ensures monitoring is active
    if (!this.isMonitoring) {
      this.startContinuousMonitoring();
    }
  }

  stopAutonomousTrading() {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🛑 AI Bot: Monitoring stopped');
  }

  private async generateTradingSignalFromData(session: LearningSession) {
    const symbol = this.extractSymbolFromUrl(session.url);
    const marketData = this.parseMarketData(session.content);
    
    const trend = this.determineTrend(marketData);
    const technicalScore = this.analyzeTechnicalIndicators(marketData);
    const sentimentScore = this.analyzeSentiment();
    
    // Don't trade against the trend
    const signal = this.generateSignalWithTrend(trend, technicalScore, sentimentScore);
    
    if (signal.signal === 'HOLD') return; // Skip HOLD signals
    
    const newSignal: TradingSignal = {
      id: Math.random().toString(36).substring(2, 9),
      symbol,
      signal: signal.signal,
      confidence: signal.confidence,
      entryPrice: marketData.currentPrice,
      stopLoss: this.calculateStopLoss(marketData.currentPrice, signal.signal, marketData),
      takeProfit1: this.calculateTakeProfit(marketData.currentPrice, signal.signal, 1),
      takeProfit2: this.calculateTakeProfit(marketData.currentPrice, signal.signal, 2),
      takeProfit3: this.calculateTakeProfit(marketData.currentPrice, signal.signal, 3),
      riskRewardRatio: 0,
      timestamp: new Date(),
      reasoning: signal.reasoning,
      source: 'Barchart Continuous Monitor',
      trend,
      riskPercentage: 2
    };
    
    // Calculate risk-reward ratio
    const riskAmount = Math.abs(newSignal.entryPrice - newSignal.stopLoss);
    const rewardAmount = Math.abs(newSignal.takeProfit1 - newSignal.entryPrice);
    newSignal.riskRewardRatio = rewardAmount / riskAmount;
    
    this.signals.unshift(newSignal);
    
    // Keep only last 50 signals
    if (this.signals.length > 50) {
      this.signals = this.signals.slice(0, 50);
    }
    
    console.log(`📊 New ${signal.signal} signal generated for ${symbol} at ${marketData.currentPrice}`);
  }
  
  private extractSymbolFromUrl(url: string): string {
    if (url.includes('%5EXAUUSD')) return 'XAUUSD';
    if (url.includes('%5EEURUSD')) return 'EURUSD';
    return 'UNKNOWN';
  }
  
  private parseMarketData(content: string) {
    // Extract current price from content
    const priceMatch = content.match(/Current Price: \$?([0-9,]+\.?[0-9]*)/);
    const currentPrice = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 2000;
    
    // Extract technical indicators
    const rsiMatch = content.match(/RSI\(14\): ([0-9.]+)/);
    const rsi = rsiMatch ? parseFloat(rsiMatch[1]) : 50;
    
    const macdMatch = content.match(/MACD: ([-0-9.]+)/);
    const macd = macdMatch ? parseFloat(macdMatch[1]) : 0;
    
    // Extract support and resistance
    const supportMatch = content.match(/Support Levels: \$([0-9,]+\.?[0-9]*)/);
    const support = supportMatch ? parseFloat(supportMatch[1].replace(',', '')) : currentPrice * 0.98;
    
    const resistanceMatch = content.match(/Resistance Levels: \$([0-9,]+\.?[0-9]*)/);
    const resistance = resistanceMatch ? parseFloat(resistanceMatch[1].replace(',', '')) : currentPrice * 1.02;
    
    return {
      currentPrice,
      rsi,
      macd,
      support,
      resistance
    };
  }
  
  private determineTrend(marketData: any): 'BULLISH' | 'BEARISH' | 'SIDEWAYS' {
    const { rsi, macd, currentPrice, support, resistance } = marketData;
    
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    // RSI analysis
    if (rsi > 50) bullishSignals++;
    else if (rsi < 50) bearishSignals++;
    
    // MACD analysis
    if (macd > 0) bullishSignals++;
    else if (macd < 0) bearishSignals++;
    
    // Price position analysis
    const pricePosition = (currentPrice - support) / (resistance - support);
    if (pricePosition > 0.6) bullishSignals++;
    else if (pricePosition < 0.4) bearishSignals++;
    
    if (bullishSignals > bearishSignals) return 'BULLISH';
    if (bearishSignals > bullishSignals) return 'BEARISH';
    return 'SIDEWAYS';
  }
  
  private generateSignalWithTrend(trend: string, technicalScore: number, sentimentScore: number) {
    const combinedScore = (technicalScore + sentimentScore) / 2;
    
    // Don't trade against the trend
    if (trend === 'BULLISH' && combinedScore > 0.6) {
      return {
        signal: 'BUY' as const,
        confidence: Math.min(0.95, combinedScore + 0.1),
        reasoning: `Bullish trend confirmed with strong technical indicators. RSI and MACD support upward momentum. Entry aligned with trend direction.`
      };
    } else if (trend === 'BEARISH' && combinedScore < 0.4) {
      return {
        signal: 'SELL' as const,
        confidence: Math.min(0.95, (1 - combinedScore) + 0.1),
        reasoning: `Bearish trend confirmed with technical breakdown. Indicators suggest continued downside pressure. Entry aligned with trend direction.`
      };
    }
    
    return {
      signal: 'HOLD' as const,
      confidence: 0.5,
      reasoning: `Mixed signals or trend not strong enough for entry. Waiting for clearer directional momentum.`
    };
  }
  
  private calculateStopLoss(entryPrice: number, signal: 'BUY' | 'SELL', marketData: any): number {
    const riskAmount = entryPrice * 0.02; // 2% risk
    
    if (signal === 'BUY') {
      // For buy signals, stop loss below entry
      const calculatedSL = entryPrice - riskAmount;
      // Use support level if it's closer than 2% risk
      return Math.max(calculatedSL, marketData.support);
    } else {
      // For sell signals, stop loss above entry
      const calculatedSL = entryPrice + riskAmount;
      // Use resistance level if it's closer than 2% risk
      return Math.min(calculatedSL, marketData.resistance);
    }
  }
  
  private calculateTakeProfit(entryPrice: number, signal: 'BUY' | 'SELL', level: number): number {
    const baseRisk = entryPrice * 0.02; // 2% risk
    
    if (signal === 'BUY') {
      // Multiple take profit levels with increasing targets
      switch (level) {
        case 1: return entryPrice + (baseRisk * 1.5); // 1:1.5 RR
        case 2: return entryPrice + (baseRisk * 2.5); // 1:2.5 RR
        case 3: return entryPrice + (baseRisk * 4.0); // 1:4 RR
        default: return entryPrice + baseRisk;
      }
    } else {
      // For sell signals
      switch (level) {
        case 1: return entryPrice - (baseRisk * 1.5); // 1:1.5 RR
        case 2: return entryPrice - (baseRisk * 2.5); // 1:2.5 RR
        case 3: return entryPrice - (baseRisk * 4.0); // 1:4 RR
        default: return entryPrice - baseRisk;
      }
    }
  }
  
  private analyzeTechnicalIndicators(marketData: any): number {
    const { rsi, macd } = marketData;
    let score = 0.5;
    
    // RSI analysis (0-100 scale)
    if (rsi < 30) score += 0.2; // Oversold - bullish
    else if (rsi > 70) score -= 0.2; // Overbought - bearish
    else if (rsi > 50) score += 0.1; // Above midline - slightly bullish
    else score -= 0.1; // Below midline - slightly bearish
    
    // MACD analysis
    if (macd > 0) score += 0.15; // Above zero line - bullish
    else score -= 0.15; // Below zero line - bearish
    
    return Math.max(0, Math.min(1, score));
  }

  getIsMonitoring(): boolean {
    return this.isMonitoring;
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
      'XAUUSD': 2020,
      'EURUSD': 1.0850,
      'GBPUSD': 1.2650,
      'USDJPY': 149.50,
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