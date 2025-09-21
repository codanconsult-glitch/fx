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

  private extractTradingInsights(content: string): string[] {
    const insights: string[] = [];
    
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

  getLearningHistory(): LearningSession[] {
    return this.learningHistory;
  }
}