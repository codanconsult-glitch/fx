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

export class ContentExtractor {
  private static readonly DIFFBOT_TOKEN = "9715a82cffb568a58f1f0c44fb6d5b1c";
  private static readonly BASE_URL = "https://api.diffbot.com/v3/analyze";

  static async extractBarchartCheatSheet(symbol: string): Promise<ExtractedContent | null> {
    const url = `https://www.barchart.com/forex/quotes/%5E${symbol}/cheat-sheet`;
    
    try {
      console.log(`🔍 Extracting real content from Barchart Cheat Sheet for ${symbol}...`);
      
      const payload = { url };
      const searchParams = new URLSearchParams(payload);
      
      const response = await fetch(
        `${this.BASE_URL}?token=${this.DIFFBOT_TOKEN}&${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: DiffbotResponse = await response.json();
      
      if (!result.objects || result.objects.length === 0) {
        console.warn(`No content extracted from ${url}`);
        return null;
      }

      const content = result.objects[0];
      const extractedContent: ExtractedContent = {
        title: content.title,
        text: content.text,
        html: content.html,
        sentiment: content.sentiment || 0.5,
        confidence: 0.9, // High confidence from Barchart professional analysis
        technicalIndicators: this.parseTechnicalIndicators(content.text || '', symbol)
      };

      console.log(`✅ Successfully extracted ${content.text?.length || 0} characters from Barchart`);
      return extractedContent;

    } catch (error) {
      console.error(`Failed to extract content from ${url}:`, error);
      return null;
    }
  }

  static async extractBarchartOpinion(symbol: string): Promise<ExtractedContent | null> {
    const url = `https://www.barchart.com/forex/quotes/%5E${symbol}/opinion`;
    
    try {
      console.log(`🔍 Extracting Barchart Opinion for ${symbol}...`);
      
      const payload = { url };
      const searchParams = new URLSearchParams(payload);
      
      const response = await fetch(
        `${this.BASE_URL}?token=${this.DIFFBOT_TOKEN}&${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
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
        technicalIndicators: this.parseTechnicalIndicators(content.text || '', symbol)
      };

    } catch (error) {
      console.error(`Failed to extract opinion from ${symbol}:`, error);
      return null;
    }
  }

  static async extractBarchartNews(symbol: string): Promise<ExtractedContent | null> {
    const url = `https://www.barchart.com/forex/quotes/%5E${symbol}/news`;
    
    try {
      console.log(`📰 Extracting Barchart News for ${symbol}...`);
      
      const payload = { url };
      const searchParams = new URLSearchParams(payload);
      
      const response = await fetch(
        `${this.BASE_URL}?token=${this.DIFFBOT_TOKEN}&${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
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
        technicalIndicators: this.parseTechnicalIndicators(content.text || '', symbol)
      };

    } catch (error) {
      console.error(`Failed to extract news from ${symbol}:`, error);
      return null;
    }
  }

  private static parseTechnicalIndicators(text: string, symbol: string): any {
    const indicators: any = {
      recommendation: 'NEUTRAL',
      signals: [],
      priceTargets: [],
      supportLevels: [],
      resistanceLevels: []
    };

    if (!text) return indicators;

    const lowerText = text.toLowerCase();

    // Parse recommendation
    if (lowerText.includes('strong buy') || lowerText.includes('strongly bullish')) {
      indicators.recommendation = 'STRONG_BUY';
    } else if (lowerText.includes('buy') || lowerText.includes('bullish')) {
      indicators.recommendation = 'BUY';
    } else if (lowerText.includes('strong sell') || lowerText.includes('strongly bearish')) {
      indicators.recommendation = 'STRONG_SELL';
    } else if (lowerText.includes('sell') || lowerText.includes('bearish')) {
      indicators.recommendation = 'SELL';
    }

    // Extract signals
    const signalPatterns = [
      'breakout', 'breakdown', 'reversal', 'continuation', 'momentum',
      'oversold', 'overbought', 'support', 'resistance', 'trend'
    ];

    signalPatterns.forEach(pattern => {
      if (lowerText.includes(pattern)) {
        indicators.signals.push(pattern.toUpperCase());
      }
    });

    // Extract price levels (simplified regex patterns)
    const priceRegex = symbol === 'XAUUSD' 
      ? /\$?(\d{4}\.?\d{0,2})/g  // Gold prices like $2650.50
      : /(\d\.\d{4})/g;          // Forex prices like 1.0550

    let match;
    const prices: number[] = [];
    
    while ((match = priceRegex.exec(text)) !== null) {
      const price = parseFloat(match[1]);
      if (symbol === 'XAUUSD' && price > 2000 && price < 3000) {
        prices.push(price);
      } else if (symbol === 'EURUSD' && price > 0.9000 && price < 1.2000) {
        prices.push(price);
      }
    }

    // Sort and categorize prices
    const sortedPrices = [...new Set(prices)].sort((a, b) => a - b);
    const currentPrice = symbol === 'XAUUSD' ? 2650 : 1.0550; // Approximate current prices

    indicators.supportLevels = sortedPrices.filter(p => p < currentPrice).slice(-3);
    indicators.resistanceLevels = sortedPrices.filter(p => p > currentPrice).slice(0, 3);
    indicators.priceTargets = sortedPrices.slice(0, 5);

    return indicators;
  }

  static async extractForexCalendar(): Promise<ExtractedContent | null> {
    const url = "https://www.forexfactory.com/calendar";
    
    try {
      console.log(`📅 Extracting Forex Calendar...`);
      
      const payload = { url };
      const searchParams = new URLSearchParams(payload);
      
      const response = await fetch(
        `${this.BASE_URL}?token=${this.DIFFBOT_TOKEN}&${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
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
        sentiment: 0.5,
        confidence: 0.95,
        technicalIndicators: this.parseCalendarEvents(content.text || '')
      };

    } catch (error) {
      console.error(`Failed to extract forex calendar:`, error);
      return null;
    }
  }

  private static parseCalendarEvents(text: string): any {
    const events: any = {
      highImpactEvents: [],
      upcomingEvents: [],
      currencies: []
    };

    if (!text) return events;

    const lowerText = text.toLowerCase();

    // High impact event keywords
    const highImpactKeywords = [
      'non-farm payrolls', 'nfp', 'interest rate', 'gdp', 'inflation',
      'cpi', 'ppi', 'employment', 'unemployment', 'fomc', 'ecb'
    ];

    highImpactKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        events.highImpactEvents.push(keyword.toUpperCase());
      }
    });

    // Extract currencies mentioned
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
    currencies.forEach(currency => {
      if (lowerText.includes(currency.toLowerCase())) {
        events.currencies.push(currency);
      }
    });

    return events;
  }
}