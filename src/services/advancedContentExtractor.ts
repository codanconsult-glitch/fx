interface ExtractedContent {
  title?: string;
  text?: string;
  html?: string;
  sentiment?: number;
  confidence?: number;
  technicalIndicators?: {
    recommendation?: string;
    signals?: string[];
    priceTargets?: number[];
    supportLevels?: number[];
    resistanceLevels?: number[];
    trend?: string;
    rsi?: number;
    macd?: number;
  };
  chartData?: {
    currentPrice?: number;
    volume?: number;
    volatility?: number;
    trendDirection?: string;
  };
  newsImpact?: {
    highImpactEvents?: string[];
    sentiment?: number;
    timeToEvent?: number;
  };
}

interface DiffbotResponse {
  objects?: Array<{
    title?: string;
    text?: string;
    html?: string;
    sentiment?: number;
    tags?: Array<{
      label: string;
      score: number;
    }>;
  }>;
}

export class AdvancedContentExtractor {
  private static readonly DIFFBOT_TOKEN = "9715a82cffb568a58f1f0c44fb6d5b1c";
  private static readonly BASE_URL = "/api/diffbot/v3/analyze";
  private static readonly GMT_OFFSET = 3; // GMT+3 timezone

  static async extractComprehensiveAnalysis(symbol: string): Promise<{
    cheatSheet: ExtractedContent | null;
    interactiveChart: ExtractedContent | null;
    opinion: ExtractedContent | null;
    news: ExtractedContent | null;
  }> {
    console.log(`🔍 Starting comprehensive analysis for ${symbol} (GMT+3)...`);
    
    // Sequential requests with delays to avoid rate limiting
    const cheatSheet = await this.extractCheatSheet(symbol);
    await this.delay(2000); // 2 second delay
    
    const interactiveChart = await this.extractInteractiveChart(symbol);
    await this.delay(2000); // 2 second delay
    
    const opinion = await this.extractOpinion(symbol);
    await this.delay(2000); // 2 second delay
    
    const news = await this.extractNews(symbol);

    return {
      cheatSheet,
      interactiveChart,
      opinion,
      news
    };
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async extractCheatSheet(symbol: string): Promise<ExtractedContent | null> {
    const url = `https://www.barchart.com/forex/quotes/%5E${symbol}/cheat-sheet`;
    
    try {
      console.log(`📊 Extracting Trader's Cheat Sheet for ${symbol}...`);
      
      const payload = { url };
      const searchParams = new URLSearchParams(payload);
      
      const response = await fetch(
        `${this.BASE_URL}?token=${this.DIFFBOT_TOKEN}&${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: DiffbotResponse = await response.json();
      
      if (!result.objects || result.objects.length === 0) {
        console.warn(`No cheat sheet content extracted for ${symbol}`);
        return null;
      }

      const content = result.objects[0];
      const extractedContent: ExtractedContent = {
        title: content.title,
        text: content.text,
        html: content.html,
        sentiment: content.sentiment || 0.5,
        confidence: 0.95, // Highest confidence for professional cheat sheet
        technicalIndicators: this.parseCheatSheetIndicators(content.text || '', symbol)
      };

      console.log(`✅ Cheat Sheet extracted: ${content.text?.length || 0} characters`);
      return extractedContent;

    } catch (error) {
      console.error(`Failed to extract cheat sheet for ${symbol}:`, error);
      return null;
    }
  }

  private static async extractInteractiveChart(symbol: string): Promise<ExtractedContent | null> {
    const url = `https://www.barchart.com/forex/quotes/%5E${symbol}/interactive-chart`;
    
    try {
      console.log(`📈 Extracting Interactive Chart for ${symbol}...`);
      
      const payload = { url };
      const searchParams = new URLSearchParams(payload);
      
      const response = await fetch(
        `${this.BASE_URL}?token=${this.DIFFBOT_TOKEN}&${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: DiffbotResponse = await response.json();
      
      if (!result.objects || result.objects.length === 0) {
        return null;
      }

      const content = result.objects[0];
      return {
        title: content.title,
        text: content.text,
        html: content.html,
        sentiment: content.sentiment || 0.5,
        confidence: 0.9,
        technicalIndicators: this.parseChartIndicators(content.text || '', symbol),
        chartData: this.parseChartData(content.text || '', symbol)
      };

    } catch (error) {
      console.error(`Failed to extract chart for ${symbol}:`, error);
      return null;
    }
  }

  private static async extractOpinion(symbol: string): Promise<ExtractedContent | null> {
    const url = `https://www.barchart.com/forex/quotes/%5E${symbol}/opinion`;
    
    try {
      console.log(`💭 Extracting Opinion for ${symbol}...`);
      
      const payload = { url };
      const searchParams = new URLSearchParams(payload);
      
      const response = await fetch(
        `${this.BASE_URL}?token=${this.DIFFBOT_TOKEN}&${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: DiffbotResponse = await response.json();
      
      if (!result.objects || result.objects.length === 0) {
        return null;
      }

      const content = result.objects[0];
      return {
        title: content.title,
        text: content.text,
        html: content.html,
        sentiment: content.sentiment || 0.5,
        confidence: 0.85,
        technicalIndicators: this.parseOpinionIndicators(content.text || '', symbol)
      };

    } catch (error) {
      console.error(`Failed to extract opinion for ${symbol}:`, error);
      return null;
    }
  }

  private static async extractNews(symbol: string): Promise<ExtractedContent | null> {
    const url = `https://www.barchart.com/forex/quotes/%5E${symbol}/news`;
    
    try {
      console.log(`📰 Extracting News for ${symbol}...`);
      
      const payload = { url };
      const searchParams = new URLSearchParams(payload);
      
      const response = await fetch(
        `${this.BASE_URL}?token=${this.DIFFBOT_TOKEN}&${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: DiffbotResponse = await response.json();
      
      if (!result.objects || result.objects.length === 0) {
        return null;
      }

      const content = result.objects[0];
      return {
        title: content.title,
        text: content.text,
        html: content.html,
        sentiment: content.sentiment || 0.5,
        confidence: 0.8,
        technicalIndicators: this.parseNewsIndicators(content.text || '', symbol),
        newsImpact: this.parseNewsImpact(content.text || '')
      };

    } catch (error) {
      console.error(`Failed to extract news for ${symbol}:`, error);
      return null;
    }
  }

  private static parseCheatSheetIndicators(text: string, symbol: string): any {
    const indicators: any = {
      recommendation: 'NEUTRAL',
      signals: [],
      priceTargets: [],
      supportLevels: [],
      resistanceLevels: [],
      trend: 'SIDEWAYS',
      rsi: 50,
      macd: 0
    };

    if (!text) return indicators;

    const lowerText = text.toLowerCase();

    // Parse professional recommendations (highest priority)
    if (lowerText.includes('strong buy') || lowerText.includes('strongly bullish')) {
      indicators.recommendation = 'STRONG_BUY';
      indicators.trend = 'BULLISH';
    } else if (lowerText.includes('buy') || lowerText.includes('bullish')) {
      indicators.recommendation = 'BUY';
      indicators.trend = 'BULLISH';
    } else if (lowerText.includes('strong sell') || lowerText.includes('strongly bearish')) {
      indicators.recommendation = 'STRONG_SELL';
      indicators.trend = 'BEARISH';
    } else if (lowerText.includes('sell') || lowerText.includes('bearish')) {
      indicators.recommendation = 'SELL';
      indicators.trend = 'BEARISH';
    }

    // Extract professional signals
    const professionalSignals = [
      'breakout', 'breakdown', 'reversal', 'continuation', 'momentum',
      'oversold', 'overbought', 'support break', 'resistance break',
      'trend change', 'consolidation', 'accumulation', 'distribution'
    ];

    professionalSignals.forEach(signal => {
      if (lowerText.includes(signal)) {
        indicators.signals.push(signal.toUpperCase().replace(' ', '_'));
      }
    });

    // Extract RSI values
    const rsiMatch = text.match(/rsi[:\s]*(\d+\.?\d*)/i);
    if (rsiMatch) {
      indicators.rsi = parseFloat(rsiMatch[1]);
    }

    // Extract MACD values
    const macdMatch = text.match(/macd[:\s]*(-?\d+\.?\d*)/i);
    if (macdMatch) {
      indicators.macd = parseFloat(macdMatch[1]);
    }

    // Extract price levels with enhanced regex
    this.extractPriceLevels(text, symbol, indicators);

    return indicators;
  }

  private static parseChartIndicators(text: string, symbol: string): any {
    const indicators: any = {
      recommendation: 'NEUTRAL',
      signals: [],
      trend: 'SIDEWAYS',
      rsi: 50,
      macd: 0
    };

    if (!text) return indicators;

    const lowerText = text.toLowerCase();

    // Chart pattern recognition
    const chartPatterns = [
      'head and shoulders', 'double top', 'double bottom', 'triangle',
      'flag', 'pennant', 'wedge', 'channel', 'cup and handle'
    ];

    chartPatterns.forEach(pattern => {
      if (lowerText.includes(pattern)) {
        indicators.signals.push(pattern.toUpperCase().replace(' ', '_'));
      }
    });

    // Trend analysis from chart
    if (lowerText.includes('uptrend') || lowerText.includes('ascending')) {
      indicators.trend = 'BULLISH';
    } else if (lowerText.includes('downtrend') || lowerText.includes('descending')) {
      indicators.trend = 'BEARISH';
    }

    return indicators;
  }

  private static parseChartData(text: string, symbol: string): any {
    const chartData: any = {
      currentPrice: symbol === 'XAUUSD' ? 2650 : 1.0550,
      volume: 0,
      volatility: 0.02,
      trendDirection: 'SIDEWAYS'
    };

    if (!text) return chartData;

    // Extract current price from chart data
    const priceRegex = symbol === 'XAUUSD' 
      ? /\$?(\d{4}\.?\d{0,2})/g
      : /(\d\.\d{4})/g;

    const prices: number[] = [];
    let match;
    
    while ((match = priceRegex.exec(text)) !== null) {
      const price = parseFloat(match[1]);
      if (symbol === 'XAUUSD' && price > 2000 && price < 3000) {
        prices.push(price);
      } else if (symbol === 'EURUSD' && price > 0.9000 && price < 1.2000) {
        prices.push(price);
      }
    }

    if (prices.length > 0) {
      chartData.currentPrice = prices[prices.length - 1]; // Most recent price
    }

    // Extract volume data
    const volumeMatch = text.match(/volume[:\s]*(\d+[,\d]*)/i);
    if (volumeMatch) {
      chartData.volume = parseInt(volumeMatch[1].replace(/,/g, ''));
    }

    return chartData;
  }

  private static parseOpinionIndicators(text: string, symbol: string): any {
    const indicators: any = {
      recommendation: 'NEUTRAL',
      signals: [],
      analystConsensus: 'NEUTRAL'
    };

    if (!text) return indicators;

    const lowerText = text.toLowerCase();

    // Analyst consensus analysis
    const bullishCount = (text.match(/bullish|buy|positive/gi) || []).length;
    const bearishCount = (text.match(/bearish|sell|negative/gi) || []).length;

    if (bullishCount > bearishCount * 1.5) {
      indicators.analystConsensus = 'BULLISH';
      indicators.recommendation = 'BUY';
    } else if (bearishCount > bullishCount * 1.5) {
      indicators.analystConsensus = 'BEARISH';
      indicators.recommendation = 'SELL';
    }

    // Extract analyst targets
    this.extractPriceLevels(text, symbol, indicators);

    return indicators;
  }

  private static parseNewsIndicators(text: string, symbol: string): any {
    const indicators: any = {
      recommendation: 'NEUTRAL',
      signals: [],
      newsType: 'NEUTRAL'
    };

    if (!text) return indicators;

    const lowerText = text.toLowerCase();

    // News sentiment analysis
    const positiveNews = ['growth', 'increase', 'rise', 'gain', 'positive', 'strong'];
    const negativeNews = ['decline', 'fall', 'drop', 'weak', 'negative', 'concern'];

    let positiveScore = 0;
    let negativeScore = 0;

    positiveNews.forEach(word => {
      positiveScore += (lowerText.match(new RegExp(word, 'g')) || []).length;
    });

    negativeNews.forEach(word => {
      negativeScore += (lowerText.match(new RegExp(word, 'g')) || []).length;
    });

    if (positiveScore > negativeScore) {
      indicators.newsType = 'POSITIVE';
      indicators.recommendation = 'BUY';
    } else if (negativeScore > positiveScore) {
      indicators.newsType = 'NEGATIVE';
      indicators.recommendation = 'SELL';
    }

    return indicators;
  }

  private static parseNewsImpact(text: string): any {
    const newsImpact: any = {
      highImpactEvents: [],
      sentiment: 0.5,
      timeToEvent: 0
    };

    if (!text) return newsImpact;

    const lowerText = text.toLowerCase();

    // High impact event detection
    const highImpactKeywords = [
      'federal reserve', 'fed', 'ecb', 'interest rate', 'nfp', 'non-farm payrolls',
      'gdp', 'inflation', 'cpi', 'ppi', 'unemployment', 'fomc', 'jackson hole'
    ];

    highImpactKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        newsImpact.highImpactEvents.push(keyword.toUpperCase());
      }
    });

    // Calculate news sentiment
    const positiveWords = (text.match(/positive|good|strong|rise|gain|growth/gi) || []).length;
    const negativeWords = (text.match(/negative|bad|weak|fall|decline|drop/gi) || []).length;
    const totalWords = positiveWords + negativeWords;

    if (totalWords > 0) {
      newsImpact.sentiment = positiveWords / totalWords;
    }

    return newsImpact;
  }

  private static extractPriceLevels(text: string, symbol: string, indicators: any): void {
    const priceRegex = symbol === 'XAUUSD' 
      ? /\$?(\d{4}\.?\d{0,2})/g
      : /(\d\.\d{4})/g;

    const prices: number[] = [];
    let match;
    
    while ((match = priceRegex.exec(text)) !== null) {
      const price = parseFloat(match[1]);
      if (symbol === 'XAUUSD' && price > 2000 && price < 3000) {
        prices.push(price);
      } else if (symbol === 'EURUSD' && price > 0.9000 && price < 1.2000) {
        prices.push(price);
      }
    }

    // Sort and categorize prices
    const uniquePrices = [...new Set(prices)].sort((a, b) => a - b);
    const currentPrice = symbol === 'XAUUSD' ? 2650 : 1.0550;

    indicators.supportLevels = uniquePrices.filter(p => p < currentPrice).slice(-3);
    indicators.resistanceLevels = uniquePrices.filter(p => p > currentPrice).slice(0, 3);
    indicators.priceTargets = uniquePrices.slice(0, 5);
  }

  static getCurrentGMTPlus3Time(): Date {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (this.GMT_OFFSET * 3600000));
  }

  static isMarketHours(): boolean {
    const gmtPlus3 = this.getCurrentGMTPlus3Time();
    const hour = gmtPlus3.getHours();
    const day = gmtPlus3.getDay();
    
    // Forex market is open 24/5, closed on weekends
    if (day === 0 || day === 6) return false; // Sunday or Saturday
    
    // Market is generally active, but less liquid during certain hours
    return true;
  }
}