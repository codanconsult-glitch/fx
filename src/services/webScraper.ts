import { WebpageSource, LearningSession } from '../types/trading';

export class WebScrapingService {
  private static instance: WebScrapingService;
  private learningHistory: LearningSession[] = [];

  static getInstance() {
    if (!WebScrapingService.instance) {
      WebScrapingService.instance = new WebScrapingService();
    }
    return WebScrapingService.instance;
  }

  async scrapeWebpage(url: string): Promise<LearningSession> {
    const startTime = Date.now();
    
    try {
      // Simulate web scraping (in production, you'd use a proper scraping service)
      const response = await this.mockScrapeContent(url);
      
      const session: LearningSession = {
        id: Math.random().toString(36).substring(2, 9),
        url,
        content: response.content,
        extractedInsights: this.extractTradingInsights(response.content),
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

      this.learningHistory.push(session);
      return session;
    } catch (error) {
      throw new Error(`Failed to scrape ${url}: ${error}`);
    }
  }

  private async mockScrapeContent(url: string): Promise<{ content: string; title: string }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Check if this is the Barchart forex cheat sheet
    if (url.includes('barchart.com/forex') && url.includes('cheat-sheet')) {
      return this.generateBarchartContent();
    }
    
    const mockContents = [
      {
        content: "Bitcoin shows strong bullish momentum with institutional adoption increasing. Technical analysis suggests a breakout above $45,000 resistance level. Volume indicators confirm upward trend continuation.",
        title: "Bitcoin Market Analysis"
      },
      {
        content: "Ethereum 2.0 upgrade shows promising developments. DeFi sector expansion continues with new protocols launching. Smart contract activity reaches all-time highs indicating network growth.",
        title: "Ethereum Network Update"
      },
      {
        content: "Federal Reserve hints at interest rate changes. Inflation data suggests monetary policy adjustments ahead. Market volatility expected in the coming weeks as economic indicators shift.",
        title: "Economic Policy Update"
      },
      {
        content: "Tesla stock surges on quarterly earnings beat. Electric vehicle market expansion accelerates globally. Clean energy initiatives drive investor confidence in the automotive sector.",
        title: "Tesla Earnings Report"
      }
    ];
    
    return mockContents[Math.floor(Math.random() * mockContents.length)];
  }

  private generateBarchartContent(): { content: string; title: string } {
    const forexPairs = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD'];
    const selectedPair = forexPairs[Math.floor(Math.random() * forexPairs.length)];
    
    const technicalSignals = [
      'Strong Buy', 'Buy', 'Weak Buy', 'Hold', 'Weak Sell', 'Sell', 'Strong Sell'
    ];
    const signal = technicalSignals[Math.floor(Math.random() * technicalSignals.length)];
    
    const indicators = [
      { name: 'RSI(14)', value: (20 + Math.random() * 60).toFixed(1), signal: Math.random() > 0.5 ? 'Oversold' : 'Overbought' },
      { name: 'MACD', value: (Math.random() * 2 - 1).toFixed(4), signal: Math.random() > 0.5 ? 'Bullish' : 'Bearish' },
      { name: 'Stochastic', value: (Math.random() * 100).toFixed(1), signal: Math.random() > 0.5 ? 'Buy' : 'Sell' },
      { name: 'Williams %R', value: (-Math.random() * 100).toFixed(1), signal: Math.random() > 0.5 ? 'Oversold' : 'Overbought' }
    ];
    
    const price = (1800 + Math.random() * 400).toFixed(2);
    const change = (Math.random() * 40 - 20).toFixed(2);
    const changePercent = (Math.random() * 2 - 1).toFixed(2);
    
    const content = `
      Barchart Forex Analysis for ${selectedPair}:
      Current Price: $${price} (${change >= '0' ? '+' : ''}${change}, ${changePercent}%)
      
      Technical Summary: ${signal}
      
      Key Technical Indicators:
      - ${indicators[0].name}: ${indicators[0].value} (${indicators[0].signal})
      - ${indicators[1].name}: ${indicators[1].value} (${indicators[1].signal})
      - ${indicators[2].name}: ${indicators[2].value} (${indicators[2].signal})
      - ${indicators[3].name}: ${indicators[3].value} (${indicators[3].signal})
      
      Market Sentiment: ${Math.random() > 0.5 ? 'Bullish momentum building with strong institutional interest' : 'Bearish pressure from economic uncertainties'}
      
      Support Levels: $${(parseFloat(price) - 15).toFixed(2)}, $${(parseFloat(price) - 25).toFixed(2)}
      Resistance Levels: $${(parseFloat(price) + 15).toFixed(2)}, $${(parseFloat(price) + 25).toFixed(2)}
      
      Volume Analysis: ${Math.random() > 0.5 ? 'Above average trading volume confirms trend strength' : 'Below average volume suggests consolidation phase'}
      
      Risk Assessment: ${Math.random() > 0.5 ? 'Moderate risk with clear technical levels' : 'High volatility expected due to upcoming economic events'}
    `;
    
    return {
      content: content.trim(),
      title: `Barchart ${selectedPair} Forex Analysis`
    };
  }

  private extractTradingInsights(content: string): string[] {
    const insights: string[] = [];
    
    // Enhanced analysis for Barchart content
    if (content.includes('Barchart')) {
      return this.extractBarchartInsights(content);
    }
    
    // Sentiment analysis keywords
    const bullishKeywords = ['bullish', 'surge', 'growth', 'increase', 'positive', 'upgrade', 'expansion'];
    const bearishKeywords = ['bearish', 'decline', 'decrease', 'negative', 'concerns', 'risks', 'volatility'];
    
    const words = content.toLowerCase().split(' ');
    
    bullishKeywords.forEach(keyword => {
      if (words.includes(keyword)) {
        insights.push(`Bullish sentiment detected: ${keyword} mentioned`);
      }
    });
    
    bearishKeywords.forEach(keyword => {
      if (words.includes(keyword)) {
        insights.push(`Bearish sentiment detected: ${keyword} mentioned`);
      }
    });
    
    // Price pattern detection
    if (content.includes('$') && content.includes('resistance')) {
      insights.push('Technical resistance level identified');
    }
    
    if (content.includes('support')) {
      insights.push('Support level mentioned in analysis');
    }
    
    return insights.length > 0 ? insights : ['General market information processed'];
  }

  private extractBarchartInsights(content: string): string[] {
    const insights: string[] = [];
    
    // Extract technical signals
    if (content.includes('Strong Buy')) {
      insights.push('Strong bullish signal detected from technical analysis');
    } else if (content.includes('Buy')) {
      insights.push('Bullish signal identified in technical indicators');
    } else if (content.includes('Strong Sell')) {
      insights.push('Strong bearish signal detected from technical analysis');
    } else if (content.includes('Sell')) {
      insights.push('Bearish signal identified in technical indicators');
    }
    
    // RSI analysis
    if (content.includes('Oversold')) {
      insights.push('RSI indicates oversold conditions - potential buying opportunity');
    } else if (content.includes('Overbought')) {
      insights.push('RSI indicates overbought conditions - potential selling pressure');
    }
    
    // MACD analysis
    if (content.includes('MACD') && content.includes('Bullish')) {
      insights.push('MACD showing bullish momentum crossover');
    } else if (content.includes('MACD') && content.includes('Bearish')) {
      insights.push('MACD indicating bearish momentum shift');
    }
    
    // Volume analysis
    if (content.includes('Above average trading volume')) {
      insights.push('High volume confirms trend strength and reliability');
    } else if (content.includes('Below average volume')) {
      insights.push('Low volume suggests consolidation or trend weakness');
    }
    
    // Support and resistance
    if (content.includes('Support Levels')) {
      insights.push('Key support and resistance levels identified for risk management');
    }
    
    // Risk assessment
    if (content.includes('High volatility expected')) {
      insights.push('Elevated volatility risk due to market events');
    } else if (content.includes('Moderate risk')) {
      insights.push('Moderate risk environment with defined technical levels');
    }
    
    return insights.length > 0 ? insights : ['Comprehensive forex technical analysis processed'];
  }

  getLearningHistory(): LearningSession[] {
    return this.learningHistory;
  }
}