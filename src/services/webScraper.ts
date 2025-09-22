import { WebpageSource, LearningSession } from '../types/trading';

export class WebScrapingService {
  private static instance: WebScrapingService;
  private learningHistory: LearningSession[] = [];
  private economicEvents: any[] = [];

  static getInstance() {
    if (!WebScrapingService.instance) {
      WebScrapingService.instance = new WebScrapingService();
    }
    return WebScrapingService.instance;
  }

  async scrapeWebpage(url: string): Promise<LearningSession> {
    const startTime = Date.now();
    
    try {
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
    
    // Handle Economic Calendar
    if (url.includes('ff_calendar_thisweek.xml')) {
      return this.generateEconomicCalendarContent();
    }
    
    // Handle EUR/USD specific URLs
    if (url.includes('%5EEURUSD')) {
      return this.generateEURUSDContent(url);
    }
    
    // Check if this is the Barchart forex cheat sheet
    if (url.includes('%5EXAUUSD')) {
      return this.generateXAUUSDContent(url);
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

  private generateEconomicCalendarContent(): { content: string; title: string } {
    const events = [
      { time: '08:30', currency: 'USD', impact: 'High', event: 'Non-Farm Payrolls', forecast: '180K', previous: '175K' },
      { time: '10:00', currency: 'EUR', impact: 'Medium', event: 'German Industrial Production', forecast: '0.2%', previous: '-0.1%' },
      { time: '14:00', currency: 'USD', impact: 'High', event: 'Federal Reserve Interest Rate Decision', forecast: '5.25%', previous: '5.25%' },
      { time: '15:30', currency: 'EUR', impact: 'High', event: 'ECB Press Conference', forecast: 'N/A', previous: 'N/A' }
    ];
    
    const selectedEvents = events.slice(0, 2 + Math.floor(Math.random() * 2));
    
    let content = "Economic Calendar - This Week's Key Events:\n\n";
    selectedEvents.forEach(event => {
      content += `${event.time} GMT - ${event.currency} ${event.event} (${event.impact} Impact)\n`;
      content += `Forecast: ${event.forecast} | Previous: ${event.previous}\n\n`;
    });
    
    content += "Market Impact Analysis:\n";
    content += "- High impact USD events may cause significant volatility in EURUSD and XAUUSD\n";
    content += "- ECB decisions directly affect EUR strength across all pairs\n";
    content += "- Employment data typically drives safe-haven flows to Gold\n";
    
    return {
      content,
      title: "Economic Calendar - Weekly Overview"
    };
  }

  private generateEURUSDContent(url: string): { content: string; title: string } {
    const currentPrice = (1.0500 + Math.random() * 0.0800).toFixed(4);
    const change = (Math.random() * 0.0040 - 0.0020).toFixed(4);
    const changePercent = (parseFloat(change) / parseFloat(currentPrice) * 100).toFixed(2);
    
    if (url.includes('/opinion')) {
      return {
        content: `EURUSD Technical Opinion:
        Current Price: ${currentPrice} (${change >= '0' ? '+' : ''}${change}, ${changePercent}%)
        
        Technical Summary: ${Math.random() > 0.5 ? 'Bullish' : 'Bearish'} bias in the near term
        
        Key Levels:
        - Immediate Support: ${(parseFloat(currentPrice) - 0.0050).toFixed(4)}
        - Strong Support: ${(parseFloat(currentPrice) - 0.0100).toFixed(4)}
        - Immediate Resistance: ${(parseFloat(currentPrice) + 0.0050).toFixed(4)}
        - Strong Resistance: ${(parseFloat(currentPrice) + 0.0100).toFixed(4)}
        
        Market Sentiment: ${Math.random() > 0.5 ? 'Risk-on sentiment supporting EUR strength' : 'USD strength on safe-haven demand'}
        
        ECB Policy Impact: European Central Bank monetary policy continues to influence EUR direction
        Fed Policy Outlook: US Federal Reserve stance affecting USD strength across majors`,
        title: "EURUSD Technical Opinion"
      };
    }
    
    if (url.includes('/trading-strategies')) {
      return {
        content: `EURUSD Trading Strategies:
        Current Setup: ${Math.random() > 0.5 ? 'Bullish breakout pattern' : 'Bearish reversal setup'}
        
        Strategy 1: Trend Following
        - Entry: ${currentPrice} on pullback to support
        - Stop Loss: ${(parseFloat(currentPrice) - 0.0080).toFixed(4)}
        - Target 1: ${(parseFloat(currentPrice) + 0.0120).toFixed(4)}
        - Target 2: ${(parseFloat(currentPrice) + 0.0200).toFixed(4)}
        
        Strategy 2: Range Trading
        - Buy Zone: ${(parseFloat(currentPrice) - 0.0060).toFixed(4)} - ${(parseFloat(currentPrice) - 0.0040).toFixed(4)}
        - Sell Zone: ${(parseFloat(currentPrice) + 0.0040).toFixed(4)} - ${(parseFloat(currentPrice) + 0.0060).toFixed(4)}
        
        Risk Management: 2% maximum risk per trade
        Position Sizing: Calculate based on stop loss distance`,
        title: "EURUSD Trading Strategies"
      };
    }
    
    if (url.includes('/cheat-sheet')) {
      return this.generateBarchartContent('EURUSD');
    }
    
    if (url.includes('/news')) {
      return {
        content: `EURUSD Market News:
        
        Latest Headlines:
        - ECB officials signal potential policy adjustments ahead
        - German economic data shows mixed signals for Eurozone growth
        - US Dollar strength continues amid Federal Reserve hawkish stance
        - European inflation data impacts EUR sentiment
        
        Market Moving Events:
        - ECB President speech scheduled for this week
        - US employment data release pending
        - German manufacturing PMI below expectations
        - EU-US trade relations developments
        
        Analyst Views:
        - Major banks ${Math.random() > 0.5 ? 'bullish' : 'bearish'} on EURUSD near-term outlook
        - Technical levels suggest ${Math.random() > 0.5 ? 'upside potential' : 'downside risk'}
        - Fundamental factors ${Math.random() > 0.5 ? 'support EUR strength' : 'favor USD dominance'}`,
        title: "EURUSD Market News"
      };
    }
    
    // Default EURUSD content
    return {
      content: `EURUSD Analysis: Current price ${currentPrice}, showing ${Math.random() > 0.5 ? 'bullish' : 'bearish'} momentum with key support at ${(parseFloat(currentPrice) - 0.0080).toFixed(4)} and resistance at ${(parseFloat(currentPrice) + 0.0080).toFixed(4)}`,
      title: "EURUSD Market Analysis"
    };
  }

  private generateXAUUSDContent(url: string): { content: string; title: string } {
    const currentPrice = (1900 + Math.random() * 300).toFixed(2);
    const change = (Math.random() * 40 - 20).toFixed(2);
    const changePercent = (parseFloat(change) / parseFloat(currentPrice) * 100).toFixed(2);
    
    if (url.includes('/overview')) {
      return {
        content: `XAUUSD Overview:
        Current Price: $${currentPrice} (${change >= '0' ? '+' : ''}${change}, ${changePercent}%)
        
        Market Summary:
        - Gold showing ${Math.random() > 0.5 ? 'strong bullish momentum' : 'bearish pressure'} 
        - Safe-haven demand ${Math.random() > 0.5 ? 'supporting' : 'weakening'} precious metals
        - USD strength ${Math.random() > 0.5 ? 'pressuring' : 'supporting'} gold prices
        
        Key Drivers:
        - Federal Reserve monetary policy outlook
        - Global economic uncertainty levels
        - Inflation expectations and real yields
        - Geopolitical tensions and risk sentiment
        
        Technical Outlook: ${Math.random() > 0.5 ? 'Bullish above $' + (parseFloat(currentPrice) - 20).toFixed(2) : 'Bearish below $' + (parseFloat(currentPrice) + 20).toFixed(2)}`,
        title: "XAUUSD Market Overview"
      };
    }
    
    if (url.includes('/opinion')) {
      return {
        content: `XAUUSD Expert Opinion:
        Current Assessment: ${Math.random() > 0.5 ? 'Bullish' : 'Bearish'} outlook for gold
        
        Technical Analysis:
        - Primary trend: ${Math.random() > 0.5 ? 'Upward' : 'Downward'}
        - Key support: $${(parseFloat(currentPrice) - 25).toFixed(2)}
        - Key resistance: $${(parseFloat(currentPrice) + 25).toFixed(2)}
        - RSI indicating ${Math.random() > 0.5 ? 'oversold conditions' : 'overbought levels'}
        
        Fundamental Factors:
        - Central bank policies affecting precious metals demand
        - Real interest rates impact on non-yielding assets
        - Dollar strength correlation with gold prices
        - Institutional and retail investor sentiment
        
        Price Targets:
        - Bullish target: $${(parseFloat(currentPrice) + 50).toFixed(2)}
        - Bearish target: $${(parseFloat(currentPrice) - 50).toFixed(2)}`,
        title: "XAUUSD Expert Opinion"
      };
    }
    
    if (url.includes('/trading-strategies')) {
      return {
        content: `XAUUSD Trading Strategies:
        
        Strategy 1: Breakout Trading
        - Monitor key level: $${currentPrice}
        - Entry on break above: $${(parseFloat(currentPrice) + 10).toFixed(2)}
        - Stop loss: $${(parseFloat(currentPrice) - 15).toFixed(2)}
        - Target 1: $${(parseFloat(currentPrice) + 35).toFixed(2)}
        - Target 2: $${(parseFloat(currentPrice) + 60).toFixed(2)}
        
        Strategy 2: Mean Reversion
        - Buy zone: $${(parseFloat(currentPrice) - 20).toFixed(2)} - $${(parseFloat(currentPrice) - 10).toFixed(2)}
        - Sell zone: $${(parseFloat(currentPrice) + 10).toFixed(2)} - $${(parseFloat(currentPrice) + 20).toFixed(2)}
        
        Risk Management:
        - Maximum 2% account risk per trade
        - Position sizing based on volatility
        - Multiple take profit levels recommended`,
        title: "XAUUSD Trading Strategies"
      };
    }
    
    if (url.includes('/cheat-sheet')) {
      return this.generateBarchartContent('XAUUSD');
    }
    
    if (url.includes('/news')) {
      return {
        content: `XAUUSD Market News:
        
        Breaking News:
        - Federal Reserve officials comment on monetary policy outlook
        - Global central banks coordinate on inflation response
        - Geopolitical tensions ${Math.random() > 0.5 ? 'escalate' : 'ease'} affecting safe-haven demand
        - Major gold ETF flows show ${Math.random() > 0.5 ? 'inflows' : 'outflows'}
        
        Economic Impact:
        - US Dollar index ${Math.random() > 0.5 ? 'strengthening' : 'weakening'} against majors
        - Real yields ${Math.random() > 0.5 ? 'rising' : 'falling'} impacting gold attractiveness
        - Inflation expectations ${Math.random() > 0.5 ? 'increasing' : 'moderating'}
        
        Technical Developments:
        - Gold breaks ${Math.random() > 0.5 ? 'above' : 'below'} key technical level
        - Volume analysis suggests ${Math.random() > 0.5 ? 'strong buying interest' : 'selling pressure'}
        - Chart patterns indicate ${Math.random() > 0.5 ? 'bullish continuation' : 'bearish reversal'}`,
        title: "XAUUSD Market News"
      };
    }
    
    if (url.includes('/performance')) {
      const timeframe = url.includes('weekly') ? 'Weekly' : url.includes('monthly') ? 'Monthly' : 'Daily';
      return {
        content: `XAUUSD ${timeframe} Performance:
        
        ${timeframe} Statistics:
        - Current Price: $${currentPrice}
        - ${timeframe} Change: ${change >= '0' ? '+' : ''}${change} (${changePercent}%)
        - ${timeframe} High: $${(parseFloat(currentPrice) + Math.random() * 30).toFixed(2)}
        - ${timeframe} Low: $${(parseFloat(currentPrice) - Math.random() * 30).toFixed(2)}
        
        Performance Metrics:
        - Volatility: ${Math.random() > 0.5 ? 'High' : 'Moderate'}
        - Trend Strength: ${Math.random() > 0.5 ? 'Strong' : 'Weak'}
        - Volume Profile: ${Math.random() > 0.5 ? 'Above Average' : 'Below Average'}
        
        Comparative Analysis:
        - vs USD Index: ${Math.random() > 0.5 ? 'Outperforming' : 'Underperforming'}
        - vs Other Commodities: ${Math.random() > 0.5 ? 'Leading' : 'Lagging'}
        - Historical Context: ${Math.random() > 0.5 ? 'Above' : 'Below'} ${timeframe.toLowerCase()} average`,
        title: `XAUUSD ${timeframe} Performance`
      };
    }
    
    // Default XAUUSD content
    return {
      content: `XAUUSD Analysis: Gold trading at $${currentPrice}, ${Math.random() > 0.5 ? 'supported by safe-haven demand' : 'pressured by USD strength'} with technical levels at $${(parseFloat(currentPrice) - 25).toFixed(2)} support and $${(parseFloat(currentPrice) + 25).toFixed(2)} resistance`,
      title: "XAUUSD Market Analysis"
    };
  }

  private extractSymbolFromUrl(url: string): string {
    if (url.includes('%5EXAUUSD')) return 'XAUUSD';
    if (url.includes('%5EEURUSD')) return 'EURUSD';
    if (url.includes('%5EGBPUSD')) return 'GBPUSD';
    if (url.includes('%5EUSDJPY')) return 'USDJPY';
    return 'XAUUSD'; // Default fallback
  }

  private generateBarchartContent(symbol: string = 'XAUUSD'): { content: string; title: string } {
    const selectedPair = symbol;
    
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
    
    // Generate realistic prices based on the forex pair
    let price: string;
    if (selectedPair === 'EURUSD') {
      price = (1.0500 + Math.random() * 0.1000).toFixed(4);
    } else if (selectedPair === 'XAUUSD') {
      price = (1800 + Math.random() * 400).toFixed(2);
    } else {
      price = (1.0000 + Math.random() * 0.5000).toFixed(4);
    }
    
    const change = (Math.random() * 40 - 20).toFixed(2);
    const changePercent = (Math.random() * 2 - 1).toFixed(4);
    
    const content = `
      Barchart Forex Analysis for ${selectedPair}:
      Current Price: ${selectedPair === 'XAUUSD' ? '$' : ''}${price} (${change >= '0' ? '+' : ''}${change}, ${changePercent}%)
      
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
      
      ${selectedPair === 'EURUSD' ? 'ECB Policy Impact: European Central Bank monetary policy continues to influence EUR strength' : ''}
      ${selectedPair === 'XAUUSD' ? 'Safe Haven Demand: Gold showing typical inverse correlation with USD strength' : ''}
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
    
    // Economic calendar insights
    if (content.includes('Economic Calendar')) {
      return this.extractEconomicInsights(content);
    }
    
    // EUR/USD specific insights
    if (content.includes('EURUSD')) {
      return this.extractEURUSDInsights(content);
    }
    
    // XAU/USD specific insights
    if (content.includes('XAUUSD')) {
      return this.extractXAUUSDInsights(content);
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

  private extractEconomicInsights(content: string): string[] {
    const insights: string[] = [];
    
    if (content.includes('High Impact')) {
      insights.push('High impact economic events scheduled - expect increased volatility');
    }
    
    if (content.includes('Non-Farm Payrolls')) {
      insights.push('NFP release will significantly impact USD pairs and gold');
    }
    
    if (content.includes('Federal Reserve') || content.includes('ECB')) {
      insights.push('Central bank decisions will drive major currency movements');
    }
    
    if (content.includes('Employment data')) {
      insights.push('Employment data typically drives safe-haven flows to gold');
    }
    
    return insights.length > 0 ? insights : ['Economic calendar events processed for market impact'];
  }

  private extractEURUSDInsights(content: string): string[] {
    const insights: string[] = [];
    
    if (content.includes('Bullish') || content.includes('bullish')) {
      insights.push('EURUSD showing bullish technical and fundamental signals');
    } else if (content.includes('Bearish') || content.includes('bearish')) {
      insights.push('EURUSD displaying bearish momentum and sentiment');
    }
    
    if (content.includes('ECB')) {
      insights.push('European Central Bank policy impacting EUR strength');
    }
    
    if (content.includes('support') && content.includes('resistance')) {
      insights.push('Key EURUSD support and resistance levels identified for trading');
    }
    
    if (content.includes('breakout')) {
      insights.push('EURUSD breakout pattern detected - momentum trade opportunity');
    }
    
    return insights.length > 0 ? insights : ['EURUSD technical and fundamental analysis processed'];
  }

  private extractXAUUSDInsights(content: string): string[] {
    const insights: string[] = [];
    
    if (content.includes('safe-haven')) {
      insights.push('Safe-haven demand driving gold price movements');
    }
    
    if (content.includes('Federal Reserve') || content.includes('Fed')) {
      insights.push('Federal Reserve policy outlook affecting gold prices');
    }
    
    if (content.includes('USD strength') || content.includes('Dollar')) {
      insights.push('US Dollar strength creating headwinds for gold');
    }
    
    if (content.includes('inflation')) {
      insights.push('Inflation expectations impacting gold as hedge asset');
    }
    
    if (content.includes('geopolitical')) {
      insights.push('Geopolitical tensions supporting gold safe-haven premium');
    }
    
    if (content.includes('breakout') || content.includes('breakdown')) {
      insights.push('Gold technical breakout/breakdown pattern identified');
    }
    
    return insights.length > 0 ? insights : ['Gold market analysis and price drivers processed'];
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