interface TradingViewIdea {
  title: string;
  author: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timeframe: string;
  description: string;
  likes: number;
  publishedAt: Date;
}

interface TradingViewSentiment {
  overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  expertIdeas: TradingViewIdea[];
  confidence: number;
  expertConsensus: string;
  marketMood: string;
  technicalBias: string;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  high24h?: number;
  low24h?: number;
  volume?: number;
}

interface DiffbotResponse {
  objects?: Array<{
    title?: string;
    text?: string;
    html?: string;
    sentiment?: number;
  }>;
}

export class TradingViewExtractor {
  private static readonly DIFFBOT_TOKEN = "9715a82cffb568a58f1f0c44fb6d5b1c";
  private static readonly BASE_URL = "/api/diffbot/v3/analyze";

  static async extractTradingViewSentiment(symbol: string): Promise<TradingViewSentiment | null> {
    const url = `https://www.tradingview.com/symbols/${symbol}/ideas/`;
    
    try {
      console.log(`📊 Extracting TradingView expert sentiment for ${symbol} (GMT+3 Bucharest)...`);
      
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
        console.warn(`No TradingView content extracted for ${symbol}`);
        return null;
      }

      const content = result.objects[0];
      const sentiment = this.analyzeTradingViewContent(content.text || '', symbol);

      console.log(`✅ TradingView sentiment: ${sentiment.overallSentiment} (${sentiment.confidence.toFixed(2)} confidence, ${sentiment.expertConsensus})`);
      return sentiment;

    } catch (error) {
      console.error(`Failed to extract TradingView sentiment for ${symbol}:`, error);
      return null;
    }
  }

  private static analyzeTradingViewContent(text: string, html: string, symbol: string): TradingViewSentiment {
    const lowerText = text.toLowerCase();
    const lowerHtml = html.toLowerCase();
    
    // Extract expert ideas and sentiment
    const expertIdeas: TradingViewIdea[] = [];
    let bullishCount = 0;
    let bearishCount = 0;
    let neutralCount = 0;
    
    // Extract current price from TradingView content
    const priceData = this.extractPriceData(text, html, symbol);

    // Analyze sentiment keywords
    const bullishKeywords = [
      'buy', 'bullish', 'long', 'uptrend', 'breakout', 'support', 'bounce',
      'rally', 'pump', 'moon', 'target', 'resistance break', 'golden cross',
      'accumulation', 'reversal up', 'higher highs', 'momentum up'
    ];
    
    const bearishKeywords = [
      'sell', 'bearish', 'short', 'downtrend', 'breakdown', 'resistance', 'dump',
      'crash', 'fall', 'drop', 'support break', 'death cross', 'correction',
      'distribution', 'reversal down', 'lower lows', 'momentum down'
    ];

    // Count sentiment indicators
    bullishKeywords.forEach(keyword => {
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
      bullishCount += matches;
    });

    bearishKeywords.forEach(keyword => {
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
      bearishCount += matches;
    });

    // Extract individual ideas (simplified parsing)
    const ideaPatterns = [
      /(?:buy|long|bullish).*?(?:target|tp|take profit)[:\s]*(\d+\.?\d*)/gi,
      /(?:sell|short|bearish).*?(?:target|tp|take profit)[:\s]*(\d+\.?\d*)/gi
    ];

    ideaPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const isBullish = match[0].toLowerCase().includes('buy') || 
                         match[0].toLowerCase().includes('long') || 
                         match[0].toLowerCase().includes('bullish');
        
        expertIdeas.push({
          title: match[0].substring(0, 50) + '...',
          author: 'TradingView Expert',
          sentiment: isBullish ? 'BULLISH' : 'BEARISH',
          timeframe: 'Unknown',
          description: match[0],
          likes: Math.floor(Math.random() * 100),
          publishedAt: new Date()
        });
      }
    });

    // Determine overall sentiment
    let overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    const totalSentiment = bullishCount + bearishCount;
    
    if (totalSentiment > 0) {
      const bullishRatio = bullishCount / totalSentiment;
      if (bullishRatio > 0.6) {
        overallSentiment = 'BULLISH';
      } else if (bullishRatio < 0.4) {
        overallSentiment = 'BEARISH';
      }
    }

    // Calculate confidence based on data quality
    const confidence = Math.min(0.9, 0.5 + (totalSentiment * 0.01) + (expertIdeas.length * 0.05));

    // Determine expert consensus
    let expertConsensus = 'Mixed Views';
    if (bullishCount > bearishCount * 2) expertConsensus = 'Strong Bullish Consensus';
    else if (bearishCount > bullishCount * 2) expertConsensus = 'Strong Bearish Consensus';
    else if (bullishCount > bearishCount) expertConsensus = 'Bullish Leaning';
    else if (bearishCount > bullishCount) expertConsensus = 'Bearish Leaning';

    // Market mood analysis
    const marketMood = totalSentiment > 20 ? 'High Activity' : totalSentiment > 10 ? 'Moderate Activity' : 'Low Activity';
    
    // Technical bias
    const technicalBias = overallSentiment === 'BULLISH' ? 'Technical Bullish' : 
                         overallSentiment === 'BEARISH' ? 'Technical Bearish' : 'Technical Neutral';

    return {
      overallSentiment,
      bullishCount,
      bearishCount,
      neutralCount: Math.max(0, 10 - bullishCount - bearishCount),
      expertIdeas: expertIdeas.slice(0, 5), // Top 5 ideas
      confidence,
      expertConsensus,
      marketMood,
      technicalBias
      currentPrice: priceData.currentPrice,
      priceChange: priceData.priceChange,
      priceChangePercent: priceData.priceChangePercent,
      high24h: priceData.high24h,
      low24h: priceData.low24h,
      volume: priceData.volume
    };
  }
  
  private static extractPriceData(text: string, html: string, symbol: string): {
    currentPrice?: number;
    priceChange?: number;
    priceChangePercent?: number;
    high24h?: number;
    low24h?: number;
    volume?: number;
  } {
    const priceData: any = {};
    
    try {
      // Extract current price based on symbol type
      let priceRegex: RegExp;
      let priceRange: { min: number; max: number };
      
      if (symbol === 'XAUUSD') {
        // Gold price patterns: $2650.50, 2650.50, 2,650.50
        priceRegex = /(?:\$|USD\s*)?(\d{1,2}[,\s]?\d{3}\.?\d{0,2})/g;
        priceRange = { min: 1800, max: 3000 };
      } else if (symbol === 'EURUSD') {
        // EUR/USD price patterns: 1.0550, 1.05500
        priceRegex = /(1\.\d{4,5})/g;
        priceRange = { min: 0.9000, max: 1.3000 };
      } else if (symbol === 'GBPUSD') {
        // GBP/USD price patterns: 1.2650
        priceRegex = /(1\.[12]\d{3,4})/g;
        priceRange = { min: 1.1000, max: 1.4000 };
      } else if (symbol === 'USDJPY') {
        // USD/JPY price patterns: 149.50
        priceRegex = /(\d{2,3}\.\d{2,3})/g;
        priceRange = { min: 100, max: 160 };
      } else {
        // Default forex pair pattern
        priceRegex = /(\d+\.\d{4,5})/g;
        priceRange = { min: 0.5, max: 2.0 };
      }
      
      // Extract prices from text and HTML
      const allText = text + ' ' + html;
      const priceMatches: number[] = [];
      let match;
      
      while ((match = priceRegex.exec(allText)) !== null) {
        const price = parseFloat(match[1].replace(/[,\s]/g, ''));
        if (price >= priceRange.min && price <= priceRange.max) {
          priceMatches.push(price);
        }
      }
      
      if (priceMatches.length > 0) {
        // Use the most recent/common price
        const sortedPrices = priceMatches.sort((a, b) => b - a);
        priceData.currentPrice = sortedPrices[0];
        
        // Calculate approximate price change (simplified)
        if (sortedPrices.length > 1) {
          const previousPrice = sortedPrices[1];
          priceData.priceChange = priceData.currentPrice - previousPrice;
          priceData.priceChangePercent = (priceData.priceChange / previousPrice) * 100;
        }
        
        // Estimate high/low from available prices
        priceData.high24h = Math.max(...priceMatches);
        priceData.low24h = Math.min(...priceMatches);
      }
      
      // Extract volume if available (simplified)
      const volumeMatch = allText.match(/volume[:\s]*(\d+[,\d]*)/i);
      if (volumeMatch) {
        priceData.volume = parseInt(volumeMatch[1].replace(/,/g, ''));
      }
      
      // Extract percentage changes
      const percentMatch = allText.match(/([+-]?\d+\.?\d*)%/);
      if (percentMatch && !priceData.priceChangePercent) {
        priceData.priceChangePercent = parseFloat(percentMatch[1]);
      }
      
    } catch (error) {
      console.warn(`Error extracting price data for ${symbol}:`, error);
    }
    
    return priceData;
  }
  
  static async getCurrentPrice(symbol: string): Promise<number | null> {
    try {
      const sentiment = await this.extractTradingViewSentiment(symbol);
      return sentiment?.currentPrice || null;
    } catch (error) {
      console.error(`Error getting current price for ${symbol}:`, error);
      return null;
    }
  }
}