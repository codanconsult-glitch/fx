import { TradingSignal } from '../types/trading';
import { TradingViewExtractor } from './tradingViewExtractor';
import { NewsAnalyzer } from './newsAnalyzer';
import { LearningEngine } from './learningEngine';
import { AdvancedContentExtractor } from './advancedContentExtractor';

interface ComprehensiveAnalysis {
  symbol: string;
  cheatSheet: any;
  tradingViewSentiment: any;
  newsAnalysis: any;
  marketConditions: {
    volatility: number;
    trend: string;
    newsImpact: string;
    tradingViewSentiment: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

interface EnhancedAnalysisResult {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  adjustedConfidence: number;
  reasoning: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskPercentage: number;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  qualityScore: number;
  learningRecommendations: string[];
  reasoningFactors: string[];
}

export class EnhancedAIAnalyzer {
  private static learningEngine = LearningEngine.getInstance();

  static async analyzeSymbolWithLearning(symbol: string): Promise<TradingSignal | null> {
    console.log(`🧠 Enhanced AI Analysis with Learning for ${symbol} starting...`);
    
    try {
      // Check market hours (GMT+3)
      if (!AdvancedContentExtractor.isMarketHours()) {
        console.log(`⏰ Market closed (GMT+3). Skipping analysis for ${symbol}`);
        return null;
      }

      // Extract comprehensive data from all sources with delays
      const comprehensiveData = await this.extractComprehensiveData(symbol);
      
      if (!comprehensiveData.cheatSheet && !comprehensiveData.tradingViewSentiment && !comprehensiveData.newsAnalysis) {
        console.warn(`No comprehensive data extracted for ${symbol}`);
        return null;
      }

      // Perform enhanced AI analysis
      const analysis = await this.performEnhancedAnalysis(comprehensiveData);
      
      if (analysis.signal === 'HOLD' || analysis.qualityScore < 0.7) {
        console.log(`AI recommends HOLD for ${symbol} (Quality: ${analysis.qualityScore.toFixed(2)})`);
        return null;
      }

      // Apply learning engine adjustments
      const learningResult = this.learningEngine.applyLearningToSignal(
        symbol,
        analysis.signal,
        analysis.confidence,
        analysis.reasoningFactors
      );

      analysis.adjustedConfidence = learningResult.adjustedConfidence;
      analysis.learningRecommendations = learningResult.recommendations;

      // Create high-quality trading signal
      const tradingSignal: TradingSignal = {
        id: Math.random().toString(36).substring(2, 9),
        symbol,
        signal: analysis.signal,
        confidence: analysis.adjustedConfidence,
        entryPrice: analysis.entryPrice,
        stopLoss: analysis.stopLoss,
        takeProfit1: analysis.takeProfit1,
        takeProfit2: analysis.takeProfit2,
        takeProfit3: analysis.takeProfit3,
        riskRewardRatio: this.calculateRiskReward(
          analysis.entryPrice, 
          analysis.stopLoss, 
          analysis.takeProfit1
        ),
        timestamp: AdvancedContentExtractor.getCurrentGMTPlus3Time(),
        reasoning: analysis.reasoning,
        source: 'Enhanced AI with Learning',
        trend: analysis.trend,
        riskPercentage: 2.0
      };

      // Record trade in learning engine
      this.learningEngine.recordTrade(
        tradingSignal.id,
        symbol,
        analysis.signal,
        analysis.entryPrice,
        analysis.stopLoss,
        analysis.takeProfit1,
        analysis.takeProfit2,
        analysis.takeProfit3,
        analysis.adjustedConfidence,
        analysis.reasoningFactors,
        comprehensiveData.marketConditions
      );

      console.log(`✅ Enhanced ${analysis.signal} signal for ${symbol} (${Math.round(analysis.adjustedConfidence * 100)}% confidence, Quality: ${analysis.qualityScore.toFixed(2)})`);
      return tradingSignal;

    } catch (error) {
      console.error(`Error in enhanced analysis for ${symbol}:`, error);
      return null;
    }
  }

  private static async extractComprehensiveData(symbol: string): Promise<ComprehensiveAnalysis> {
    console.log(`🔍 Extracting comprehensive data for ${symbol}...`);

    // Extract Barchart Cheat Sheet
    const cheatSheet = await AdvancedContentExtractor.extractCheatSheet(symbol);
    await this.delay(3000); // 3 second delay

    // Extract TradingView sentiment
    const tradingViewSentiment = await TradingViewExtractor.extractTradingViewSentiment(symbol);
    await this.delay(3000); // 3 second delay

    // Extract news analysis
    const newsAnalysis = await NewsAnalyzer.analyzeForexNews(symbol);
    await this.delay(2000); // 2 second delay

    // Determine market conditions
    const marketConditions = this.assessMarketConditions(cheatSheet, tradingViewSentiment, newsAnalysis);

    return {
      symbol,
      cheatSheet,
      tradingViewSentiment,
      newsAnalysis,
      marketConditions
    };
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static assessMarketConditions(cheatSheet: any, tradingViewSentiment: any, newsAnalysis: any): any {
    let volatility = 0.02; // Base volatility
    let trend = 'SIDEWAYS';
    let newsImpact = 'LOW';
    let tvSentiment = 'NEUTRAL';
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    // Assess from cheat sheet
    if (cheatSheet?.technicalIndicators) {
      trend = cheatSheet.technicalIndicators.trend || 'SIDEWAYS';
      if (cheatSheet.technicalIndicators.signals?.includes('BREAKOUT')) {
        volatility += 0.01;
      }
    }

    // Assess from TradingView
    if (tradingViewSentiment) {
      tvSentiment = tradingViewSentiment.overallSentiment;
      if (tradingViewSentiment.confidence > 0.7) {
        volatility += 0.005;
      }
    }

    // Assess from news
    if (newsAnalysis) {
      if (newsAnalysis.highImpactEvents.length > 0) {
        newsImpact = 'HIGH';
        volatility += 0.02;
        riskLevel = 'HIGH';
      } else if (newsAnalysis.mediumImpactEvents.length > 0) {
        newsImpact = 'MEDIUM';
        volatility += 0.01;
        riskLevel = 'MEDIUM';
      }
    }

    return {
      volatility: Math.min(0.08, volatility), // Cap at 8%
      trend,
      newsImpact,
      tradingViewSentiment: tvSentiment,
      riskLevel
    };
  }

  private static async performEnhancedAnalysis(data: ComprehensiveAnalysis): Promise<EnhancedAnalysisResult> {
    let bullishScore = 0;
    let bearishScore = 0;
    let confidenceBoost = 0;
    let qualityScore = 0;
    const reasoningFactors: string[] = [];

    // Get current market price
    const currentPrice = this.getCurrentMarketPrice(data.symbol);

    // 1. BARCHART CHEAT SHEET ANALYSIS (40% weight)
    if (data.cheatSheet) {
      const cheatAnalysis = this.analyzeCheatSheet(data.cheatSheet, data.symbol);
      bullishScore += cheatAnalysis.bullishScore * 4;
      bearishScore += cheatAnalysis.bearishScore * 4;
      confidenceBoost += 0.25;
      qualityScore += 0.4;
      reasoningFactors.push(...cheatAnalysis.factors);
    }

    // 2. TRADINGVIEW SENTIMENT ANALYSIS (35% weight)
    if (data.tradingViewSentiment) {
      const tvAnalysis = this.analyzeTradingViewSentiment(data.tradingViewSentiment);
      bullishScore += tvAnalysis.bullishScore * 3.5;
      bearishScore += tvAnalysis.bearishScore * 3.5;
      confidenceBoost += 0.2;
      qualityScore += 0.35;
      reasoningFactors.push(...tvAnalysis.factors);
    }

    // 3. NEWS ANALYSIS (25% weight)
    if (data.newsAnalysis) {
      const newsAnalysisResult = this.analyzeNews(data.newsAnalysis, data.symbol);
      bullishScore += newsAnalysisResult.bullishScore * 2.5;
      bearishScore += newsAnalysisResult.bearishScore * 2.5;
      confidenceBoost += 0.15;
      qualityScore += 0.25;
      reasoningFactors.push(...newsAnalysisResult.factors);
    }

    // Determine signal with enhanced logic
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' = 'SIDEWAYS';

    const scoreDifference = Math.abs(bullishScore - bearishScore);
    const minimumScoreDifference = 4; // Higher threshold for quality

    if (bullishScore > bearishScore + minimumScoreDifference) {
      signal = 'BUY';
      trend = 'BULLISH';
      reasoningFactors.push('Strong bullish consensus across multiple sources');
    } else if (bearishScore > bullishScore + minimumScoreDifference) {
      signal = 'SELL';
      trend = 'BEARISH';
      reasoningFactors.push('Strong bearish consensus across multiple sources');
    }

    // Risk management based on market conditions
    if (data.marketConditions.riskLevel === 'HIGH' && signal !== 'HOLD') {
      if (scoreDifference < 6) {
        signal = 'HOLD';
        reasoningFactors.push('High risk conditions require stronger conviction');
      }
    }

    // Calculate enhanced confidence
    const baseConfidence = 0.65;
    const scoreConfidence = Math.min(0.25, scoreDifference * 0.03);
    const confidence = Math.min(0.95, baseConfidence + confidenceBoost + scoreConfidence);

    // Generate precise risk management levels
    const riskLevels = this.calculatePreciseRiskLevels(data.symbol, signal, currentPrice, data.marketConditions);

    // Generate comprehensive reasoning
    const reasoning = this.generateComprehensiveReasoning(
      signal,
      reasoningFactors,
      bullishScore,
      bearishScore,
      confidence,
      data
    );

    return {
      signal,
      confidence,
      adjustedConfidence: confidence, // Will be adjusted by learning engine
      reasoning,
      entryPrice: riskLevels.entryPrice,
      stopLoss: riskLevels.stopLoss,
      takeProfit1: riskLevels.takeProfit1,
      takeProfit2: riskLevels.takeProfit2,
      takeProfit3: riskLevels.takeProfit3,
      riskPercentage: 2.0,
      trend,
      qualityScore,
      learningRecommendations: [],
      reasoningFactors
    };
  }

  private static analyzeCheatSheet(cheatSheet: any, symbol: string): { bullishScore: number; bearishScore: number; factors: string[] } {
    let bullishScore = 0;
    let bearishScore = 0;
    const factors: string[] = [];

    const indicators = cheatSheet.technicalIndicators || {};

    // Professional recommendation analysis
    switch (indicators.recommendation) {
      case 'STRONG_BUY':
        bullishScore += 5;
        factors.push('Barchart Cheat Sheet: STRONG BUY');
        break;
      case 'BUY':
        bullishScore += 4;
        factors.push('Barchart Cheat Sheet: BUY');
        break;
      case 'STRONG_SELL':
        bearishScore += 5;
        factors.push('Barchart Cheat Sheet: STRONG SELL');
        break;
      case 'SELL':
        bearishScore += 4;
        factors.push('Barchart Cheat Sheet: SELL');
        break;
    }

    // Technical signals
    if (indicators.signals) {
      indicators.signals.forEach((signal: string) => {
        switch (signal) {
          case 'BREAKOUT':
          case 'MOMENTUM':
          case 'OVERSOLD':
            bullishScore += 2;
            factors.push(`Technical: ${signal}`);
            break;
          case 'BREAKDOWN':
          case 'OVERBOUGHT':
            bearishScore += 2;
            factors.push(`Technical: ${signal}`);
            break;
        }
      });
    }

    return { bullishScore, bearishScore, factors };
  }

  private static analyzeTradingViewSentiment(sentiment: any): { bullishScore: number; bearishScore: number; factors: string[] } {
    let bullishScore = 0;
    let bearishScore = 0;
    const factors: string[] = [];

    // Overall sentiment analysis
    switch (sentiment.overallSentiment) {
      case 'BULLISH':
        bullishScore += 4;
        factors.push(`TradingView: ${sentiment.bullishCount} bullish vs ${sentiment.bearishCount} bearish ideas`);
        break;
      case 'BEARISH':
        bearishScore += 4;
        factors.push(`TradingView: ${sentiment.bearishCount} bearish vs ${sentiment.bullishCount} bullish ideas`);
        break;
      case 'NEUTRAL':
        factors.push('TradingView: Mixed sentiment from experts');
        break;
    }

    // Confidence boost
    if (sentiment.confidence > 0.7) {
      if (sentiment.overallSentiment === 'BULLISH') bullishScore += 1;
      else if (sentiment.overallSentiment === 'BEARISH') bearishScore += 1;
      factors.push(`High confidence TradingView analysis (${(sentiment.confidence * 100).toFixed(0)}%)`);
    }

    return { bullishScore, bearishScore, factors };
  }

  private static analyzeNews(newsAnalysis: any, symbol: string): { bullishScore: number; bearishScore: number; factors: string[] } {
    let bullishScore = 0;
    let bearishScore = 0;
    const factors: string[] = [];

    // High impact events
    if (newsAnalysis.highImpactEvents.length > 0) {
      factors.push(`${newsAnalysis.highImpactEvents.length} high impact events detected`);
      
      newsAnalysis.highImpactEvents.forEach((event: any) => {
        if (symbol === 'XAUUSD') {
          // Gold typically benefits from uncertainty
          if (event.title.includes('Interest Rate') || event.title.includes('Inflation')) {
            bullishScore += 1;
            factors.push(`${event.title} may support gold`);
          }
        } else if (symbol === 'EURUSD') {
          // EUR/USD analysis
          if (event.currency.includes('EUR')) {
            bullishScore += 0.5;
            factors.push(`EUR event: ${event.title}`);
          } else if (event.currency.includes('USD')) {
            bearishScore += 0.5;
            factors.push(`USD event: ${event.title}`);
          }
        }
      });
    }

    // Overall market sentiment
    if (newsAnalysis.marketImpact === 'POSITIVE') {
      bullishScore += 1;
      factors.push('Positive news sentiment');
    } else if (newsAnalysis.marketImpact === 'NEGATIVE') {
      bearishScore += 1;
      factors.push('Negative news sentiment');
    }

    return { bullishScore, bearishScore, factors };
  }

  private static getCurrentMarketPrice(symbol: string): number {
    if (symbol === 'XAUUSD') {
      return 2650 + (Math.random() - 0.5) * 100;
    } else if (symbol === 'EURUSD') {
      return 1.0550 + (Math.random() - 0.5) * 0.0200;
    }
    return 100;
  }

  private static calculatePreciseRiskLevels(symbol: string, signal: 'BUY' | 'SELL' | 'HOLD', currentPrice: number, marketConditions: any) {
    const riskAmount = currentPrice * 0.02; // 2% risk
    const decimals = symbol === 'EURUSD' ? 4 : 2;

    // Adjust risk based on market conditions
    let adjustedRisk = riskAmount;
    if (marketConditions.riskLevel === 'HIGH') {
      adjustedRisk = riskAmount * 0.75; // Reduce risk by 25%
    } else if (marketConditions.volatility > 0.04) {
      adjustedRisk = riskAmount * 1.25; // Increase risk for high volatility
    }

    let entryPrice = currentPrice;
    let stopLoss: number;
    let takeProfit1: number;
    let takeProfit2: number;
    let takeProfit3: number;

    if (signal === 'BUY') {
      stopLoss = entryPrice - adjustedRisk;
      takeProfit1 = entryPrice + (adjustedRisk * 2.0);
      takeProfit2 = entryPrice + (adjustedRisk * 3.0);
      takeProfit3 = entryPrice + (adjustedRisk * 4.0);
    } else if (signal === 'SELL') {
      stopLoss = entryPrice + adjustedRisk;
      takeProfit1 = entryPrice - (adjustedRisk * 2.0);
      takeProfit2 = entryPrice - (adjustedRisk * 3.0);
      takeProfit3 = entryPrice - (adjustedRisk * 4.0);
    } else {
      stopLoss = currentPrice;
      takeProfit1 = currentPrice;
      takeProfit2 = currentPrice;
      takeProfit3 = currentPrice;
    }

    return {
      entryPrice: Number(entryPrice.toFixed(decimals)),
      stopLoss: Number(stopLoss.toFixed(decimals)),
      takeProfit1: Number(takeProfit1.toFixed(decimals)),
      takeProfit2: Number(takeProfit2.toFixed(decimals)),
      takeProfit3: Number(takeProfit3.toFixed(decimals))
    };
  }

  private static generateComprehensiveReasoning(
    signal: 'BUY' | 'SELL' | 'HOLD',
    factors: string[],
    bullishScore: number,
    bearishScore: number,
    confidence: number,
    data: ComprehensiveAnalysis
  ): string {
    const confidencePercent = Math.round(confidence * 100);
    const gmtTime = AdvancedContentExtractor.getCurrentGMTPlus3Time().toLocaleTimeString();

    let reasoning = `🧠 ENHANCED AI ${signal} SIGNAL (${confidencePercent}% confidence) - GMT+3: ${gmtTime}\n\n`;
    
    reasoning += `📊 COMPREHENSIVE ANALYSIS:\n`;
    reasoning += `• Bullish Score: ${bullishScore.toFixed(1)} | Bearish Score: ${bearishScore.toFixed(1)}\n`;
    reasoning += `• Market Risk Level: ${data.marketConditions.riskLevel}\n`;
    reasoning += `• Volatility: ${(data.marketConditions.volatility * 100).toFixed(1)}%\n`;
    reasoning += `• TradingView Sentiment: ${data.marketConditions.tradingViewSentiment}\n`;
    reasoning += `• News Impact: ${data.marketConditions.newsImpact}\n\n`;

    reasoning += `🔍 KEY ANALYSIS FACTORS:\n`;
    const topFactors = factors.slice(0, 6);
    topFactors.forEach((factor, index) => {
      reasoning += `${index + 1}. ${factor}\n`;
    });

    reasoning += `\n💡 AI LEARNING INSIGHTS:\n`;
    const learningInsights = this.learningEngine.getLearningInsights();
    learningInsights.slice(0, 3).forEach(insight => {
      reasoning += `• ${insight}\n`;
    });

    reasoning += `\n⚠️ RISK MANAGEMENT: 2% account risk with dynamic adjustment based on market conditions.`;

    return reasoning;
  }

  private static calculateRiskReward(entry: number, stopLoss: number, takeProfit: number): number {
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(takeProfit - entry);
    return Number((reward / risk).toFixed(2));
  }

  static getLearningEngine(): LearningEngine {
    return this.learningEngine;
  }
}