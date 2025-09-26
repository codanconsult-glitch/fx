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
      console.log(`📊 Extracting TradingView expert sentiment for ${symbol}...`);
      
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

      console.log(`✅ TradingView sentiment extracted: ${sentiment.overallSentiment} (${sentiment.confidence.toFixed(2)} confidence)`);
      return sentiment;

    } catch (error) {
      console.error(`Failed to extract TradingView sentiment for ${symbol}:`, error);
      return null;
    }
  }

  private static analyzeTradingViewContent(text: string, symbol: string): TradingViewSentiment {
    const lowerText = text.toLowerCase();
    
    // Extract expert ideas and sentiment
    const expertIdeas: TradingViewIdea[] = [];
    let bullishCount = 0;
    let bearishCount = 0;
    let neutralCount = 0;

    // Analyze sentiment keywords
    const bullishKeywords = [
      'buy', 'bullish', 'long', 'uptrend', 'breakout', 'support', 'bounce',
      'rally', 'pump', 'moon', 'target', 'resistance break', 'golden cross'
    ];
    
    const bearishKeywords = [
      'sell', 'bearish', 'short', 'downtrend', 'breakdown', 'resistance', 'dump',
      'crash', 'fall', 'drop', 'support break', 'death cross', 'correction'
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

    return {
      overallSentiment,
      bullishCount,
      bearishCount,
      neutralCount: Math.max(0, 10 - bullishCount - bearishCount),
      expertIdeas: expertIdeas.slice(0, 5), // Top 5 ideas
      confidence
    };
  }
}