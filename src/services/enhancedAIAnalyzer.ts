import { TradingSignal } from '../types/trading';
import { TradingViewExtractor } from './tradingViewExtractor';
import { NewsAnalyzer } from './newsAnalyzer';
import { LearningEngine } from './learningEngine';
import { DXYCorrelationAnalyzer } from './dxyCorrelationAnalyzer';
import { InteractiveChartAnalyzer } from './interactiveChartAnalyzer';
import { SupabaseBrainService, MarketAnalysisData } from './supabaseClient';
import { InvestingPriceService } from './investingPriceService';

interface ComprehensiveAnalysis {
  symbol: string;
  tradingViewSentiment: any;
  newsAnalysis: any;
  dxyCorrelation: any;
  interactiveChart: any;
  marketConditions: {
    volatility: number;
    trend: string;
    newsImpact: string;
    tradingViewSentiment: string;
    dxyImpact: string;
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
    console.log(`🧠 Enhanced AI Analysis with Learning for ${symbol} starting (GMT+3 Bucharest)...`);
    
    try {
      // Check market hours (GMT+3)
      if (!this.isMarketHours()) {
        console.log(`⏰ Market closed (GMT+3). Skipping analysis for ${symbol}`);
        return null;
      }

      // Extract comprehensive data from all sources with delays
      const comprehensiveData = await this.extractComprehensiveData(symbol);

      if (!comprehensiveData.tradingViewSentiment && !comprehensiveData.newsAnalysis) {
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
        timestamp: this.getCurrentGMTPlus3Time(),
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

    // Extract TradingView sentiment
    const tradingViewSentiment = await TradingViewExtractor.extractTradingViewSentiment(symbol);
    await this.delay(3000); // 3 second delay

    // Extract news analysis
    const newsAnalysis = await NewsAnalyzer.analyzeForexNews(symbol);
    await this.delay(2000); // 2 second delay

    // Extract DXY correlation analysis
    const dxyCorrelation = await DXYCorrelationAnalyzer.analyzeDXYCorrelation(symbol);
    await this.delay(2000); // 2 second delay

    // Extract interactive chart analysis
    const interactiveChart = await InteractiveChartAnalyzer.analyzeInteractiveChart(symbol);
    await this.delay(2000); // 2 second delay

    // Determine market conditions
    const marketConditions = this.assessMarketConditions(
      tradingViewSentiment, newsAnalysis, dxyCorrelation, interactiveChart
    );

    // Save all analysis data to Supabase
    await this.saveAnalysisData(symbol, {
      tradingViewSentiment,
      newsAnalysis,
      dxyCorrelation,
      interactiveChart
    });

    return {
      symbol,
      tradingViewSentiment,
      newsAnalysis,
      dxyCorrelation,
      interactiveChart,
      marketConditions
    };
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static assessMarketConditions(
    tradingViewSentiment: any, 
    newsAnalysis: any,
    dxyCorrelation: any,
    interactiveChart: any
  ): any {
    let volatility = 0.02; // Base volatility
    let trend = 'SIDEWAYS';
    let newsImpact = 'LOW';
    let tvSentiment = 'NEUTRAL';
    let dxyImpact = 'NEUTRAL';
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    // Assess from TradingView
    if (tradingViewSentiment) {
      tvSentiment = tradingViewSentiment.overallSentiment;
      if (tradingViewSentiment.confidence > 0.7) {
        volatility += 0.005;
      }
    }

    // Assess from news
    if (newsAnalysis) {
      if (newsAnalysis.highImpactEvents && newsAnalysis.highImpactEvents.length > 0) {
        newsImpact = 'HIGH';
        volatility += 0.02;
        riskLevel = 'HIGH';
      } else if (newsAnalysis.mediumImpactEvents && newsAnalysis.mediumImpactEvents.length > 0) {
        newsImpact = 'MEDIUM';
        volatility += 0.01;
        riskLevel = 'MEDIUM';
      }
    }

    // Assess from DXY correlation
    if (dxyCorrelation) {
      dxyImpact = dxyCorrelation.expectedImpact;
      if (dxyCorrelation.correlationStrength === 'STRONG') {
        volatility += 0.005;
        if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      }
    }

    // Assess from interactive chart
    if (interactiveChart) {
      if (interactiveChart.volatility === 'HIGH') {
        volatility += 0.015;
        riskLevel = 'HIGH';
      } else if (interactiveChart.volatility === 'MEDIUM') {
        volatility += 0.008;
      }
    }

    return {
      volatility: Math.min(0.08, volatility), // Cap at 8%
      trend,
      newsImpact,
      tradingViewSentiment: tvSentiment,
      dxyImpact,
      riskLevel
    };
  }

  private static async saveAnalysisData(symbol: string, analysisData: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      
      // Save TradingView analysis
      if (analysisData.tradingViewSentiment) {
        await SupabaseBrainService.saveMarketAnalysis({
          symbol,
          analysis_type: 'TRADINGVIEW',
          analysis_data: analysisData.tradingViewSentiment,
          sentiment_score: analysisData.tradingViewSentiment.confidence || 0.5,
          confidence_level: analysisData.tradingViewSentiment.confidence || 0.5,
          created_at: timestamp
        });
      }

      // Save News analysis
      if (analysisData.newsAnalysis) {
        await SupabaseBrainService.saveMarketAnalysis({
          symbol,
          analysis_type: 'NEWS',
          analysis_data: analysisData.newsAnalysis,
          sentiment_score: analysisData.newsAnalysis.overallSentiment || 0.5,
          confidence_level: 0.8,
          created_at: timestamp
        });
      }

      // Save DXY correlation analysis
      if (analysisData.dxyCorrelation) {
        await SupabaseBrainService.saveMarketAnalysis({
          symbol,
          analysis_type: 'DXY',
          analysis_data: analysisData.dxyCorrelation,
          sentiment_score: 0.5,
          confidence_level: 0.9,
          created_at: timestamp
        });
      }

      // Save Interactive chart analysis
      if (analysisData.interactiveChart) {
        await SupabaseBrainService.saveMarketAnalysis({
          symbol,
          analysis_type: 'CHART',
          analysis_data: analysisData.interactiveChart,
          sentiment_score: analysisData.interactiveChart.confidence || 0.5,
          confidence_level: analysisData.interactiveChart.confidence || 0.5,
          created_at: timestamp
        });
      }

      console.log(`💾 Analysis data saved to Supabase for ${symbol}`);
    } catch (error) {
      console.error('Error saving analysis data:', error);
    }
  }

  private static async performEnhancedAnalysis(data: ComprehensiveAnalysis): Promise<EnhancedAnalysisResult> {
    let bullishScore = 0;
    let bearishScore = 0;
    let confidenceBoost = 0;
    let qualityScore = 0;
    const reasoningFactors: string[] = [];

    // Get real current market price from Investing.com
    const currentPrice = await this.getRealCurrentMarketPrice(data.symbol);

    // Load AI brain data for this symbol
    const brainData = await SupabaseBrainService.getBrainData(data.symbol);
    let brainAdjustment = 0;

    if (brainData) {
      console.log(`🧠 AI Brain loaded for ${data.symbol}: Confidence=${brainData.confidence}, Wins=${brainData.successfulTrades}, Losses=${brainData.failedTrades}`);

      // Apply learned adjustments based on historical performance
      if (brainData.confidence > 0.75 && brainData.successfulTrades > 5) {
        brainAdjustment = 2;
        confidenceBoost += 0.1;
        reasoningFactors.push(`AI Brain: High confidence (${Math.round(brainData.confidence * 100)}%) from ${brainData.successfulTrades} wins`);
      } else if (brainData.confidence < 0.4 && brainData.failedTrades > 3) {
        brainAdjustment = -2;
        reasoningFactors.push(`AI Brain: Low confidence (${Math.round(brainData.confidence * 100)}%) after ${brainData.failedTrades} losses - reducing signal strength`);
      }

      // Apply learned insights
      if (brainData.insights && brainData.insights.length > 0) {
        const latestInsight = brainData.insights[brainData.insights.length - 1];
        reasoningFactors.push(`AI Brain Insight: ${latestInsight}`);
      }
    }

    // 1. TRADINGVIEW SENTIMENT ANALYSIS (40% weight)
    if (data.tradingViewSentiment) {
      const tvAnalysis = this.analyzeTradingViewSentiment(data.tradingViewSentiment);
      bullishScore += tvAnalysis.bullishScore * 4;
      bearishScore += tvAnalysis.bearishScore * 4;
      confidenceBoost += 0.25;
      qualityScore += 0.35;
      reasoningFactors.push(...tvAnalysis.factors);

      // Use TradingView price if available
      if (data.tradingViewSentiment.currentPrice) {
        reasoningFactors.push(`Real TradingView price: ${data.tradingViewSentiment.currentPrice}`);
      }
    }

    // 2. NEWS ANALYSIS (20% weight)
    if (data.newsAnalysis) {
      const newsAnalysisResult = this.analyzeNews(data.newsAnalysis, data.symbol);
      bullishScore += newsAnalysisResult.bullishScore * 2;
      bearishScore += newsAnalysisResult.bearishScore * 2;
      confidenceBoost += 0.15;
      qualityScore += 0.2;
      reasoningFactors.push(...newsAnalysisResult.factors);
    }

    // 3. DXY CORRELATION ANALYSIS (20% weight)
    if (data.dxyCorrelation) {
      const dxyAnalysis = this.analyzeDXYCorrelation(data.dxyCorrelation, data.symbol);
      bullishScore += dxyAnalysis.bullishScore * 2;
      bearishScore += dxyAnalysis.bearishScore * 2;
      confidenceBoost += 0.15;
      qualityScore += 0.2;
      reasoningFactors.push(...dxyAnalysis.factors);
    }

    // 4. INTERACTIVE CHART ANALYSIS (20% weight)
    if (data.interactiveChart) {
      const chartAnalysis = this.analyzeInteractiveChart(data.interactiveChart);
      bullishScore += chartAnalysis.bullishScore * 2;
      bearishScore += chartAnalysis.bearishScore * 2;
      confidenceBoost += 0.1;
      qualityScore += 0.2;
      reasoningFactors.push(...chartAnalysis.factors);
    }

    // Apply brain adjustment to scores
    if (brainAdjustment > 0) {
      bullishScore += brainAdjustment;
    } else if (brainAdjustment < 0) {
      // Reduce both scores when brain has low confidence
      bullishScore += brainAdjustment;
      bearishScore += brainAdjustment;
    }

    // Determine signal with enhanced logic
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' = 'SIDEWAYS';

    const scoreDifference = Math.abs(bullishScore - bearishScore);
    const minimumScoreDifference = 5; // Higher threshold for quality

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
    const riskLevels = this.calculatePreciseRiskLevels(data.symbol, signal, currentPrice, data.marketConditions, 0.01); // 1% risk

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
      riskPercentage: 1.0,
      trend,
      qualityScore,
      learningRecommendations: [],
      reasoningFactors
    };
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
    
    // Price movement analysis
    if (sentiment.priceChangePercent) {
      if (sentiment.priceChangePercent > 1) {
        bullishScore += 1;
        factors.push(`Strong upward price movement: +${sentiment.priceChangePercent.toFixed(2)}%`);
      } else if (sentiment.priceChangePercent < -1) {
        bearishScore += 1;
        factors.push(`Strong downward price movement: ${sentiment.priceChangePercent.toFixed(2)}%`);
      }
    }

    return { bullishScore, bearishScore, factors };
  }

  private static analyzeDXYCorrelation(dxyCorrelation: any, symbol: string): { bullishScore: number; bearishScore: number; factors: string[] } {
    let bullishScore = 0;
    let bearishScore = 0;
    const factors: string[] = [];

    if (!dxyCorrelation) return { bullishScore, bearishScore, factors };

    // DXY impact analysis
    if (dxyCorrelation.expectedImpact === 'POSITIVE') {
      bullishScore += 3;
      factors.push(`DXY correlation supports ${symbol} strength`);
    } else if (dxyCorrelation.expectedImpact === 'NEGATIVE') {
      bearishScore += 3;
      factors.push(`DXY correlation suggests ${symbol} weakness`);
    }

    // Correlation strength
    if (dxyCorrelation.correlationStrength === 'STRONG') {
      factors.push(`Strong DXY correlation (${dxyCorrelation.dxyCorrelation.toFixed(2)}) increases signal reliability`);
      if (dxyCorrelation.expectedImpact === 'POSITIVE') bullishScore += 1;
      else if (dxyCorrelation.expectedImpact === 'NEGATIVE') bearishScore += 1;
    }

    factors.push(dxyCorrelation.tradingRecommendation);

    return { bullishScore, bearishScore, factors };
  }

  private static analyzeInteractiveChart(interactiveChart: any): { bullishScore: number; bearishScore: number; factors: string[] } {
    let bullishScore = 0;
    let bearishScore = 0;
    const factors: string[] = [];

    if (!interactiveChart) return { bullishScore, bearishScore, factors };

    // Trading signal from chart
    if (interactiveChart.tradingSignal === 'BUY') {
      bullishScore += 3;
      factors.push(`Interactive chart analysis: BUY signal (${(interactiveChart.confidence * 100).toFixed(1)}%)`);
    } else if (interactiveChart.tradingSignal === 'SELL') {
      bearishScore += 3;
      factors.push(`Interactive chart analysis: SELL signal (${(interactiveChart.confidence * 100).toFixed(1)}%)`);
    }

    // Trend analysis
    if (interactiveChart.trend === 'BULLISH') {
      bullishScore += 2;
      factors.push('Chart trend: BULLISH');
    } else if (interactiveChart.trend === 'BEARISH') {
      bearishScore += 2;
      factors.push('Chart trend: BEARISH');
    }

    // Momentum analysis
    if (interactiveChart.momentum === 'STRONG') {
      factors.push(`Strong momentum detected`);
      if (interactiveChart.trend === 'BULLISH') bullishScore += 1;
      else if (interactiveChart.trend === 'BEARISH') bearishScore += 1;
    }

    // Key insights
    if (interactiveChart.keyInsights && interactiveChart.keyInsights.length > 0) {
      factors.push(interactiveChart.keyInsights[0]);
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

  private static async getRealCurrentMarketPrice(symbol: string): Promise<number> {
    try {
      const realPrice = await InvestingPriceService.getRealTimePrice(symbol);
      if (realPrice && realPrice > 0) {
        console.log(`💰 Using Investing.com price for ${symbol}: ${realPrice}`);
        return realPrice;
      }
    } catch (error) {
      console.warn(`Failed to get Investing.com price for ${symbol}, using fallback:`, error);
    }

    if (symbol === 'XAUUSD') {
      return 2650;
    } else if (symbol === 'EURUSD') {
      return 1.0850;
    }
    return 100;
  }

  private static calculatePreciseRiskLevels(symbol: string, signal: 'BUY' | 'SELL' | 'HOLD', currentPrice: number, marketConditions: any, riskPercent: number = 0.01) {
    const riskAmount = currentPrice * riskPercent; // 1% risk by default
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
    
    // Add real price information
    if (data.tradingViewSentiment?.currentPrice) {
      reasoning += `• Real TradingView Price: ${data.tradingViewSentiment.currentPrice}\n`;
      if (data.tradingViewSentiment.priceChangePercent) {
        reasoning += `• Price Change: ${data.tradingViewSentiment.priceChangePercent.toFixed(2)}%\n`;
      }
    }
    
    reasoning += `• DXY Impact: ${data.marketConditions.dxyImpact}\n`;
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

    reasoning += `\n⚠️ RISK MANAGEMENT: 1% account risk with dynamic adjustment based on real market conditions.`;

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

  private static getCurrentGMTPlus3Time(): Date {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3 * 3600000));
  }

  private static isMarketHours(): boolean {
    const gmtPlus3 = this.getCurrentGMTPlus3Time();
    const hour = gmtPlus3.getHours();
    const day = gmtPlus3.getDay();
    
    // Forex market is open 24/5, closed on weekends
    if (day === 0 || day === 6) return false; // Sunday or Saturday
    
    return true;
  }
}