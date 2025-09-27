interface NewsEvent {
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  currency: string;
  time: Date;
  forecast?: string;
  previous?: string;
  actual?: string;
  description: string;
}

interface NewsAnalysis {
  highImpactEvents: NewsEvent[];
  mediumImpactEvents: NewsEvent[];
  lowImpactEvents: NewsEvent[];
  overallSentiment: number;
  marketImpact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  affectedSymbols: string[];
  newsStrength: number;
  timeToNextEvent: number;
  marketRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface DiffbotResponse {
  objects?: Array<{
    title?: string;
    text?: string;
    html?: string;
    sentiment?: number;
  }>;
}

export class NewsAnalyzer {
  private static readonly DIFFBOT_TOKEN = "9715a82cffb568a58f1f0c44fb6d5b1c";
  private static readonly BASE_URL = "/api/diffbot/v3/analyze";

  static async analyzeForexNews(symbol: string): Promise<NewsAnalysis | null> {
    const barchartUrl = `https://www.barchart.com/forex/quotes/%5E${symbol}/news`;
    
    try {
      console.log(`📰 Analyzing forex news for ${symbol} (GMT+3 Bucharest)...`);
      
      const payload = { url: barchartUrl };
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
        console.warn(`No news content extracted for ${symbol}`);
        return null;
      }

      const content = result.objects[0];
      const analysis = this.parseNewsContent(content.text || '', symbol);

      console.log(`✅ News analysis: ${analysis.highImpactEvents.length} high, ${analysis.mediumImpactEvents.length} medium, ${analysis.lowImpactEvents.length} low impact events`);
      return analysis;

    } catch (error) {
      console.error(`Failed to analyze news for ${symbol}:`, error);
      return null;
    }
  }

  private static parseNewsContent(text: string, symbol: string): NewsAnalysis {
    const lowerText = text.toLowerCase();
    const highImpactEvents: NewsEvent[] = [];
    const mediumImpactEvents: NewsEvent[] = [];
    const lowImpactEvents: NewsEvent[] = [];

    // High impact keywords
    const highImpactKeywords = [
      'federal reserve', 'fed', 'fomc', 'interest rate', 'rate decision',
      'non-farm payrolls', 'nfp', 'employment', 'unemployment rate',
      'gdp', 'gross domestic product', 'inflation', 'cpi', 'consumer price index',
      'ppi', 'producer price index', 'ecb', 'european central bank', 'boe',
      'jackson hole', 'powell', 'yellen', 'lagarde', 'bailey', 'dxy', 'dollar index',
      'crude oil', 'wti', 'brent', 'opec', 'geopolitical', 'war', 'sanctions'
    ];

    // Medium impact keywords
    const mediumImpactKeywords = [
      'retail sales', 'consumer confidence', 'manufacturing', 'pmi',
      'housing starts', 'building permits', 'trade balance',
      'industrial production', 'capacity utilization', 'jobless claims',
      'ism', 'michigan sentiment', 'philadelphia fed', 'empire state'
    ];

    // Low impact keywords
    const lowImpactKeywords = [
      'existing home sales', 'new home sales', 'consumer credit',
      'wholesale inventories', 'business inventories', 'construction spending',
      'pending home sales', 'factory orders', 'durable goods'
    ];

    // Calculate news strength and market risk
    const newsStrength = (highImpactEvents.length * 3) + (mediumImpactEvents.length * 2) + lowImpactEvents.length;
    let marketRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    
    if (highImpactEvents.length >= 2) marketRisk = 'HIGH';
    else if (highImpactEvents.length >= 1 || mediumImpactEvents.length >= 3) marketRisk = 'MEDIUM';

    // Estimate time to next major event (simplified)
    const timeToNextEvent = Math.random() * 24; // Hours (would be calculated from actual calendar)

    // Parse high impact events
    highImpactKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        highImpactEvents.push({
          title: this.capitalizeWords(keyword),
          impact: 'HIGH',
          currency: this.getCurrencyFromSymbol(symbol),
          time: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000), // Random time within 24h
          description: `${this.capitalizeWords(keyword)} event detected in news analysis`,
          forecast: this.extractForecast(text, keyword),
          previous: this.extractPrevious(text, keyword)
        });
      }
    });

    // Parse medium impact events
    mediumImpactKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        mediumImpactEvents.push({
          title: this.capitalizeWords(keyword),
          impact: 'MEDIUM',
          currency: this.getCurrencyFromSymbol(symbol),
          time: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000),
          description: `${this.capitalizeWords(keyword)} event detected in news analysis`
        });
      }
    });

    // Parse low impact events
    lowImpactKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        lowImpactEvents.push({
          title: this.capitalizeWords(keyword),
          impact: 'LOW',
          currency: this.getCurrencyFromSymbol(symbol),
          time: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000),
          description: `${this.capitalizeWords(keyword)} event detected in news analysis`
        });
      }
    });

    // Calculate overall sentiment
    const positiveWords = (text.match(/positive|good|strong|rise|gain|growth|bullish|optimistic/gi) || []).length;
    const negativeWords = (text.match(/negative|bad|weak|fall|decline|drop|bearish|pessimistic/gi) || []).length;
    const totalWords = positiveWords + negativeWords;
    
    const overallSentiment = totalWords > 0 ? positiveWords / totalWords : 0.5;
    
    let marketImpact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
    if (overallSentiment > 0.6) marketImpact = 'POSITIVE';
    else if (overallSentiment < 0.4) marketImpact = 'NEGATIVE';

    return {
      highImpactEvents,
      mediumImpactEvents,
      lowImpactEvents,
      overallSentiment,
      marketImpact,
      affectedSymbols: [symbol],
      newsStrength,
      timeToNextEvent,
      marketRisk
    };
  }

  private static getCurrencyFromSymbol(symbol: string): string {
    if (symbol === 'XAUUSD') return 'USD';
    if (symbol === 'EURUSD') return 'EUR,USD';
    if (symbol === 'GBPUSD') return 'GBP,USD';
    if (symbol === 'USDJPY') return 'USD,JPY';
    return 'USD';
  }

  private static capitalizeWords(str: string): string {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private static extractForecast(text: string, keyword: string): string | undefined {
    const forecastRegex = new RegExp(`${keyword}.*?forecast[:\\s]*([\\d\\.]+%?)`, 'i');
    const match = text.match(forecastRegex);
    return match ? match[1] : undefined;
  }

  private static extractPrevious(text: string, keyword: string): string | undefined {
    const previousRegex = new RegExp(`${keyword}.*?previous[:\\s]*([\\d\\.]+%?)`, 'i');
    const match = text.match(previousRegex);
    return match ? match[1] : undefined;
  }
}